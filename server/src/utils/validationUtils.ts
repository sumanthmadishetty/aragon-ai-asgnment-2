import { Image } from '@prisma/client';
import sharp from 'sharp';
import config from '../config/app';

/**
 * Validates image dimensions against the minimum requirements
 */
export function validateImageDimensions(width: number, height: number): { valid: boolean; message?: string } {
  if (width < config.minImageWidth || height < config.minImageHeight) {
    return {
      valid: false,
      message: `Image resolution too small. Minimum required: ${config.minImageWidth}x${config.minImageHeight}, Got: ${width}x${height}`
    };
  }
  
  return { valid: true };
}

/**
 * Validates image mime type against allowed types
 */
export function validateImageType(mimeType: string): { valid: boolean; message?: string } {
  if (!config.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      message: `File type not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Calculates Hamming distance between two image hashes
 * Lower distance means more similar images
 */
export function calculateHashSimilarity(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must be equal');
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Determines if two images are duplicates based on hash similarity
 * Uses Hamming distance threshold
 */
export function isDuplicate(hash1: string, hash2: string, threshold = 3): boolean {
  const distance = calculateHashSimilarity(hash1, hash2);
  return distance <= threshold;
}

/**
 * Calculates the percentage of the image that a face occupies
 */
export function calculateFacePercentage(
  imageWidth: number, 
  imageHeight: number, 
  faceWidth: number, 
  faceHeight: number
): number {
  const imageArea = imageWidth * imageHeight;
  const faceArea = faceWidth * faceHeight;
  
  return (faceArea / imageArea) * 100;
}

/**
 * Formats image size to a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/**
 * Creates a standardized validation error response
 */
export function createValidationError(message: string, fieldName?: string): { error: string; field?: string } {
  return {
    error: message,
    field: fieldName
  };
}

/**
 * Gets image metadata using sharp
 */
export async function getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
  return await sharp(buffer).metadata();
}