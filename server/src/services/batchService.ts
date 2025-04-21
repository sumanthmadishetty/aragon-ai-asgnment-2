import { prisma } from '../config/database';
import { Batch, BatchStatus, Image, ImageStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { processImage } from './imageProcessingService';

/**
 * Create a new batch
 */
export async function createBatch(data: {
  name: string;
  userId: string;
  description?: string;
}): Promise<Batch> {
  const { name, userId, description } = data;
  
  return prisma.batch.create({
    data: {
      name,
      userId,
      description,
      status: BatchStatus.PROCESSING
    }
  });
}

/**
 * Get a batch by ID
 */
export async function getBatchById(id: string): Promise<Batch | null> {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      images: {
        include: {
          processingInfo: true,
          faceInfo: true
        }
      }
    }
  });
}

/**
 * Get all batches with filtering and pagination
 */
interface GetBatchesOptions {
  userId?: string;
  status?: BatchStatus;
  page?: number;
  limit?: number;
}

export async function getBatches(options: GetBatchesOptions = {}): Promise<{
  batches: Batch[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { userId, status, page = 1, limit = 10 } = options;
  
  // Build where clause
  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count
  const total = await prisma.batch.count({ where });
  
  // Get batches
  const batches = await prisma.batch.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      images: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });
  
  return {
    batches,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get batches by user ID
 */
export async function getBatchesByUserId(
  userId: string,
  page = 1,
  limit = 10
): Promise<{
  batches: Batch[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getBatches({ userId, page, limit });
}

/**
 * Add an image to a batch
 */
export async function addImageToBatch(batchId: string, imageId: string): Promise<void> {
  await prisma.image.update({
    where: { id: imageId },
    data: { batchId }
  });
  
  // Update batch statistics
  await updateBatchStatistics(batchId);
}

/**
 * Process all images in a batch
 */
export async function processBatchImages(batchId: string): Promise<void> {
  // Get all images in the batch with PROCESSING status
  const images = await prisma.image.findMany({
    where: {
      batchId,
      status: ImageStatus.PROCESSING
    },
    select: { id: true }
  });
  
  // Process each image asynchronously
  // In a production environment, this would be handled by a queue
  for (const image of images) {
    processImage(image.id).catch(error => {
      console.error(`Error processing image ${image.id}:`, error);
    });
  }
}

/**
 * Update batch statistics
 */
export async function updateBatchStatistics(batchId: string): Promise<Batch> {
  // Get count of images in each status
  const imageStatusCounts = await prisma.image.groupBy({
    by: ['status'],
    where: { batchId },
    _count: true
  });
  
  // Initialize counters
  let totalImages = 0;
  let processedImages = 0;
  let validImages = 0;
  let rejectedImages = 0;
  let errorImages = 0;
  
  // Calculate counts
  imageStatusCounts.forEach(statusCount => {
    const count = statusCount._count;
    totalImages += count;
    
    switch (statusCount.status) {
      case ImageStatus.VALIDATED:
        validImages += count;
        processedImages += count;
        break;
      case ImageStatus.REJECTED:
        rejectedImages += count;
        processedImages += count;
        break;
      case ImageStatus.ERROR:
        errorImages += count;
        processedImages += count;
        break;
    }
  });
  
  // Determine batch status
  let batchStatus = BatchStatus.PROCESSING;
  let completedAt = null;
  
  if (totalImages > 0 && totalImages === processedImages) {
    batchStatus = errorImages > 0 ? BatchStatus.FAILED : BatchStatus.COMPLETED;
    completedAt = new Date();
  }
  
  // Update batch
  return prisma.batch.update({
    where: { id: batchId },
    data: {
      status: batchStatus,
      totalImages,
      processedImages,
      validImages,
      rejectedImages,
      errorImages,
      completedAt
    }
  });
}

/**
 * Delete a batch and all associated images
 */
export async function deleteBatch(id: string): Promise<Batch> {
  // Get the images in the batch to delete from S3
  const images = await prisma.image.findMany({
    where: { batchId: id },
    select: { id: true, s3Key: true }
  });
  
  // Get image IDs for deletion
  const imageIds = images.map(image => image.id);
  
  // Delete associated records (cascade will handle the rest)
  return prisma.batch.delete({
    where: { id },
    include: {
      images: true
    }
  });
}