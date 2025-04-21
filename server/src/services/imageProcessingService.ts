import sharp from "sharp";
import * as heicConvert from "heic-convert";
import { Jimp, intToRGBA } from "jimp";

import imghash from "imghash";
import { prisma } from "../config/database";
import config from "../config/app";
import {
  DetectFacesCommand,
  DetectFacesCommandInput,
} from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../config/s3";
import { Image, ImageStatus, FaceInfo } from "@prisma/client";
import { getFromS3 } from "./s3Service";
import { calculateHashSimilarity } from "../utils/validationUtils";

/**
 * Process the uploaded image and validate it
 */
export async function processImage(imageId: string): Promise<Image> {
  // Start processing
  const startTime = Date.now();

  try {
    // Get the image from the database
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: { processingInfo: true },
    });

    if (!image) {
      throw new Error(`Image with ID ${imageId} not found`);
    }

    // Fetch the image from S3
    const imageBuffer = await getFromS3(image.s3Key);

    // Process the image
    const result = await runAllValidations(imageBuffer, image);

    // Update the image in the database
    const processingTime = Date.now() - startTime;

    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        status: result.valid ? ImageStatus.VALIDATED : ImageStatus.REJECTED,
        rejectionReason: result.error,
        processingInfo: {
          update: {
            completedAt: new Date(),
            processingTimeMs: processingTime,
            error: result.error,
          },
        },
      },
      include: { processingInfo: true, faceInfo: true },
    });

    return updatedImage;
  } catch (error) {
    // Handle errors
    const processingTime = Date.now() - startTime;

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update the image status to ERROR
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        status: ImageStatus.ERROR,
        processingInfo: {
          update: {
            completedAt: new Date(),
            processingTimeMs: processingTime,
            error: errorMessage,
          },
        },
      },
      include: { processingInfo: true },
    });

    return updatedImage;
  }
}

/**
 * Run all validations on the image
 */
async function runAllValidations(
  imageBuffer: Buffer,
  image: Image
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 1. Convert HEIC to JPEG if needed
    let processedBuffer = imageBuffer;
    let isHeicConverted = false;

    if (image.mimeType === "image/heic") {
      processedBuffer = await convertHeicToJpeg(imageBuffer);
      isHeicConverted = true;

      // Update the mime type
      await prisma.image.update({
        where: { id: image.id },
        data: {
          mimeType: "image/jpeg",
          processingInfo: {
            update: {
              convertedFromHeic: true,
            },
          },
        },
      });
    }

    // 2. Get image metadata
    const metadata = await sharp(processedBuffer).metadata();
    const { width, height } = metadata;

    // 3. Validate image size
    if (width < config.minImageWidth || height < config.minImageHeight) {
      return {
        valid: false,
        error: `Image resolution too small. Minimum required: ${config.minImageWidth}x${config.minImageHeight}, Got: ${width}x${height}`,
      };
    }

    // 4. Calculate image hash for similarity detection
    const hash = await calculateImageHash(processedBuffer);

    // 5. Check for duplicate images
    const duplicateImage = await findDuplicateImage(
      hash,
      image.id,
      image.batchId
    );
    if (duplicateImage) {
      return {
        valid: false,
        error: `Duplicate image detected. Similar to image with ID: ${duplicateImage.id}`,
      };
    }

    // 6. Check for blur
    const blurScore = await calculateBlurScore(processedBuffer);
    if (blurScore < config.blurThreshold) {
      return {
        valid: false,
        error: `Image is too blurry. Blur score: ${blurScore}, Threshold: ${config.blurThreshold}`,
      };
    }

    // 7. Detect faces
    const faceDetectionResult = await detectFaces(processedBuffer);

    // Store face info in the database
    await storeFaceInfo(image.id, faceDetectionResult);

    // 8. Validate face requirements
    if (faceDetectionResult.faceCount === 0) {
      return {
        valid: false,
        error: "No faces detected in the image",
      };
    }

    if (faceDetectionResult.faceCount > 1) {
      return {
        valid: false,
        error: `Multiple faces detected: ${faceDetectionResult.faceCount} faces found`,
      };
    }

    if (faceDetectionResult.primaryFaceArea < config.minFaceAreaPercent) {
      return {
        valid: false,
        error: `Face too small. Face area: ${faceDetectionResult.primaryFaceArea.toFixed(
          2
        )}%, Minimum required: ${config.minFaceAreaPercent}%`,
      };
    }

    // 9. Update the image hash
    await prisma.image.update({
      where: { id: image.id },
      data: {
        hash,
        blurScore,
      },
    });

    // All validations passed
    return { valid: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown validation error";
    return { valid: false, error: errorMessage };
  }
}

/**
 * Convert HEIC image to JPEG
 */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    const jpegBuffer = await heicConvert({
      buffer,
      format: "JPEG",
      quality: 90,
    });

    return Buffer.from(jpegBuffer);
  } catch (error) {
    throw new Error(
      `Failed to convert HEIC to JPEG: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Calculate image hash for similarity detection
 */
async function calculateImageHash(buffer: Buffer): Promise<string> {
  try {
    return await imghash.hash(buffer, 16);
  } catch (error) {
    throw new Error(
      `Failed to calculate image hash: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Find duplicate images by comparing hashes
 */
async function findDuplicateImage(
  hash: string,
  currentImageId: string,
  batchId: string
): Promise<Image | null> {
  // First try an exact match for efficiency
  const exactMatch = await prisma.image.findFirst({
    where: {
      hash,
      id: { not: currentImageId },
      status: ImageStatus.VALIDATED,
      batchId: batchId,
    },
  });

  if (exactMatch) {
    return exactMatch;
  }

  // No exact match, search for similar images using Hamming distance
  // This is less efficient as we need to fetch and compare all validated images
  // In a production environment, consider using a specialized image similarity database
  // or store precomputed similarity metrics

  // Maximum Hamming distance to consider a duplicate (lower = stricter)
  const HAMMING_THRESHOLD = 3;

  // Get all validated images with hashes
  const validatedImages = await prisma.image.findMany({
    where: {
      id: { not: currentImageId },
      status: ImageStatus.VALIDATED,
      hash: { not: null },
      batchId: batchId,
    },
    select: {
      id: true,
      hash: true,
    },
  });

  // Find similar images based on Hamming distance
  for (const img of validatedImages) {
    if (img.hash) {
      try {
        // Calculate Hamming distance between hashes
        const hammingDistance = calculateHashSimilarity(hash, img.hash);

        // If distance is below threshold, consider it a duplicate
        if (hammingDistance <= HAMMING_THRESHOLD) {
          return await prisma.image.findUnique({
            where: { id: img.id },
          });
        }
      } catch (error) {
        // Skip comparison if hashes are of different lengths
        console.warn(
          `Hash comparison failed for image ${img.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  // No duplicates found
  return null;
}

/**
 * Calculate blur score using Laplacian variance
 */
async function calculateBlurScore(buffer: Buffer): Promise<number> {
  try {
    const image = await Jimp.read(buffer);

    // Convert image to grayscale
    image.greyscale();

    // Get image data
    const width = image.width;
    const height = image.height;

    // Laplacian kernel for edge detection
    const laplacian = [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ];

    // Apply Laplacian filter
    let sum = 0;
    let pixelCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelValue = 0;

        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = intToRGBA(image.getPixelColor(x + kx, y + ky));
            pixelValue += pixel.r * laplacian[ky + 1][kx + 1];
          }
        }

        sum += pixelValue * pixelValue;
        pixelCount++;
      }
    }

    // Calculate variance (higher = sharper, lower = blurrier)
    const variance = pixelCount > 0 ? sum / pixelCount : 0;

    return variance;
  } catch (error) {
    throw new Error(
      `Failed to calculate blur score: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Detect faces in the image using AWS Rekognition
 */
interface FaceDetectionResult {
  faceCount: number;
  primaryFaceArea: number; // as percentage of total image area
  confidence: number;
  boundingBox?: any;
  landmarks?: any;
}

async function detectFaces(buffer: Buffer): Promise<FaceDetectionResult> {
  try {
    const params: DetectFacesCommandInput = {
      Image: {
        Bytes: buffer,
      },
      Attributes: ["ALL"],
    };

    const command = new DetectFacesCommand(params);
    const response = await rekognitionClient.send(command);

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return {
        faceCount: 0,
        primaryFaceArea: 0,
        confidence: 0,
      };
    }

    // Sort faces by size (largest first)
    const sortedFaces = [...response.FaceDetails].sort((a, b) => {
      const areaA =
        a.BoundingBox?.Width && a.BoundingBox?.Height
          ? a.BoundingBox.Width * a.BoundingBox.Height
          : 0;
      const areaB =
        b.BoundingBox?.Width && b.BoundingBox?.Height
          ? b.BoundingBox.Width * b.BoundingBox.Height
          : 0;
      return areaB - areaA;
    });

    const primaryFace = sortedFaces[0];

    // Calculate face area as percentage of image
    const faceArea =
      primaryFace.BoundingBox?.Width && primaryFace.BoundingBox?.Height
        ? primaryFace.BoundingBox.Width * primaryFace.BoundingBox.Height * 100
        : 0;

    return {
      faceCount: response.FaceDetails.length,
      primaryFaceArea: faceArea,
      confidence: primaryFace.Confidence || 0,
      boundingBox: primaryFace.BoundingBox,
      landmarks: primaryFace.Landmarks,
    };
  } catch (error) {
    console.error("Face detection error:", error);
    return {
      faceCount: 0,
      primaryFaceArea: 0,
      confidence: 0,
    };
  }
}

/**
 * Store face detection information in the database
 */
async function storeFaceInfo(
  imageId: string,
  faceInfo: FaceDetectionResult
): Promise<FaceInfo> {
  const { faceCount, primaryFaceArea, confidence, boundingBox, landmarks } =
    faceInfo;

  // Check if face info already exists
  const existingFaceInfo = await prisma.faceInfo.findUnique({
    where: { imageId },
  });

  if (existingFaceInfo) {
    // Update existing record
    return prisma.faceInfo.update({
      where: { id: existingFaceInfo.id },
      data: {
        faceCount,
        primaryFaceArea,
        confidence,
        boundingBox: boundingBox || undefined,
        landmarks: landmarks || undefined,
      },
    });
  } else {
    // Create new record
    return prisma.faceInfo.create({
      data: {
        imageId,
        faceCount,
        primaryFaceArea,
        confidence,
        boundingBox: boundingBox || undefined,
        landmarks: landmarks || undefined,
      },
    });
  }
}
