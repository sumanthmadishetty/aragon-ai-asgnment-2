import { prisma } from "../config/database";
import { Image, ImageStatus, Prisma, Batch } from "@prisma/client";
import { uploadToS3, getPresignedUrl, deleteFromS3 } from "./s3Service";
import sharp from "sharp";
import { processImage } from "./imageProcessingService";
import { updateBatchStatistics } from "./batchService";
import { imageRepository } from "../repositories/imageRepository";

/**
 * Create a new image record and initiate processing
 */
export async function createImage(
  file: Express.Multer.File,
  batchId: string,
  userId: string
): Promise<Image> {
  const startTime = performance.now();

  try {
    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }

    // Get image metadata
    const metadata = await sharp(file.buffer).metadata();

    // Upload the file to S3
    const s3Result = await uploadToS3(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // Create image record in the database
    const image = await imageRepository.create({
      originalName: file.originalname,
      s3Key: s3Result.key,
      s3Url: s3Result.url,
      mimeType: file.mimetype,
      size: file.size,
      width: metadata.width || 0,
      height: metadata.height || 0,
      status: ImageStatus.PROCESSING,
      userId,
      isDeleted: false,
      batch: {
        connect: { id: batchId },
      },
      processingInfo: {
        create: {
          startedAt: new Date(),
        },
      },
    });

    // Update batch statistics
    await updateBatchStatistics(batchId);

    // Process the image asynchronously
    // In a production environment, this would be handled by a queue
    // such as Bull, AWS SQS, or similar
    //
    // PRODUCTION IMPLEMENTATION EXAMPLE:
    //
    // For Redis-based queue (Bull):
    // import Queue from 'bull';
    // const imageProcessingQueue = new Queue('image-processing');
    // await imageProcessingQueue.add({ imageId: image.id, batchId });
    //
    // For AWS SQS:
    // import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
    // const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
    // await sqsClient.send(new SendMessageCommand({
    //   QueueUrl: process.env.SQS_QUEUE_URL,
    //   MessageBody: JSON.stringify({ imageId: image.id, batchId }),
    // }));
    //
    // The queue worker/consumer would then call processImage() and updateBatchStatistics()

    // For development, we process directly:

    const updatedImage = await processImage(image.id);
    await updateBatchStatistics(batchId);

    return updatedImage;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create image: ${errorMessage}`);
  }
}

/**
 * Create multiple images at once for a batch
 */
export async function createImages(
  files: Express.Multer.File[],
  batchId: string,
  userId: string
): Promise<{
  successCount: number;
  errorCount: number;
  images: Image[];
  errors: Array<{ filename: string; error: string }>;
}> {
  const results = {
    successCount: 0,
    errorCount: 0,
    images: [] as Image[],
    errors: [] as Array<{ filename: string; error: string }>,
  };

  // Process each file
  for (const file of files) {
    try {
      const image = await createImage(file, batchId, userId);
      results.images.push(image);
      results.successCount++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push({
        filename: file.originalname,
        error: errorMessage,
      });
      results.errorCount++;
    }
  }

  // Update batch statistics
  await updateBatchStatistics(batchId);

  return results;
}

/**
 * Get an image by ID
 */
export async function getImageById(id: string): Promise<Image | null> {
  try {
    const image = await imageRepository.findById(id);

    if (image) {
      // Generate a fresh presigned URL if it's old
      const freshUrl = await getPresignedUrl(image.s3Key);
      return { ...image, s3Url: freshUrl };
    }

    return image;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to get image: ${errorMessage}`);
  }
}

/**
 * Get all images with pagination and filtering
 */
interface GetImagesOptions {
  userId?: string;
  batchId?: string;
  status?: ImageStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean; // Whether to include soft-deleted images
}

export async function getImages(options: GetImagesOptions = {}): Promise<{
  images: Image[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const {
    userId,
    batchId,
    status,
    page = 1,
    limit = 10,
    sortBy = "uploadedAt",
    sortOrder = "desc",
    includeDeleted = false,
  } = options;

  try {
    // Build where clause
    const where: Prisma.ImageWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    if (batchId) {
      where.batchId = batchId;
    }

    // Handle isDeleted filtering - by default we exclude deleted images
    // If includeDeleted is true, we don't add an isDeleted filter so we get both
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    // Build order by
    const orderBy: Prisma.ImageOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.ImageOrderByWithRelationInput] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await imageRepository.count(where);

    // Get images
    const images = await imageRepository.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      includeRelations: true,
    });

    // Generate fresh URLs for all images
    const imagesWithFreshUrls = await Promise.all(
      images.map(async (image) => {
        const freshUrl = await getPresignedUrl(image.s3Key);
        return { ...image, s3Url: freshUrl };
      })
    );

    return {
      images: imagesWithFreshUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to get images: ${errorMessage}`);
  }
}

/**
 * Get images by batch ID
 */
export async function getImagesByBatchId(
  batchId: string,
  options: Omit<GetImagesOptions, "batchId"> = {}
): Promise<{
  images: Image[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getImages({ ...options, batchId });
}

/**
 * Get images by user ID
 */
export async function getImagesByUserId(
  userId: string,
  options: Omit<GetImagesOptions, "userId"> = {}
): Promise<{
  images: Image[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getImages({ ...options, userId });
}

/**
 * Get soft-deleted images with pagination and filtering
 * Primarily for admin or data recovery purposes
 */
export async function getDeletedImages(
  options: Omit<GetImagesOptions, "includeDeleted"> = {}
): Promise<{
  images: Image[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const {
      userId,
      batchId,
      status,
      page = 1,
      limit = 10,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = options;

    // Build where clause - force isDeleted = true
    const where: Prisma.ImageWhereInput = {
      isDeleted: true,
    };

    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    if (batchId) {
      where.batchId = batchId;
    }

    // Build order by
    const orderBy: Prisma.ImageOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.ImageOrderByWithRelationInput] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count of deleted images
    const total = await imageRepository.count(where);

    // Get deleted images
    const images = await imageRepository.findDeleted({
      where,
      orderBy,
      skip,
      take: limit,
      includeRelations: true,
    });

    // Generate fresh URLs for all images
    const imagesWithFreshUrls = await Promise.all(
      images.map(async (image) => {
        const freshUrl = await getPresignedUrl(image.s3Key);
        return { ...image, s3Url: freshUrl };
      })
    );

    return {
      images: imagesWithFreshUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to get deleted images: ${errorMessage}`);
  }
}

/**
 * Soft delete an image
 */
export async function softDeleteImage(id: string): Promise<Image> {
  try {
    // Get the image
    const image = await imageRepository.findById(id);

    if (!image) {
      throw new Error(`Image with ID ${id} not found`);
    }

    // Soft delete the image - marks as deleted but keeps in database
    const deletedImage = await imageRepository.softDelete(id);

    // Update batch statistics
    await updateBatchStatistics(image.batchId);

    return deletedImage;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to soft delete image: ${errorMessage}`);
  }
}

/**
 * Restore a soft-deleted image
 */
export async function restoreImage(id: string): Promise<Image> {
  try {
    // Get the image (include deleted ones since we want to restore it)
    const image = await imageRepository.findById(id, true, true);

    if (!image) {
      throw new Error(`Image with ID ${id} not found`);
    }

    if (!image.isDeleted) {
      throw new Error(`Image with ID ${id} is not deleted`);
    }

    // Restore the image
    const restoredImage = await imageRepository.restore(id);

    // Update batch statistics
    await updateBatchStatistics(image.batchId);

    return restoredImage;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to restore image: ${errorMessage}`);
  }
}

/**
 * Hard delete an image
 */
export async function deleteImage(id: string): Promise<Image> {
  try {
    // Get the image - include both active and soft-deleted images
    const image = await imageRepository.findById(id, false, true);

    if (!image) {
      throw new Error(`Image with ID ${id} not found`);
    }

    // Delete from S3
    await deleteFromS3(image.s3Key);

    // Hard delete from database
    // Note: Cascading deletes will take care of ProcessingInfo and FaceInfo
    const deletedImage = await imageRepository.hardDelete(id);

    // Update batch statistics
    await updateBatchStatistics(image.batchId);

    return deletedImage;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to delete image: ${errorMessage}`);
  }
}
