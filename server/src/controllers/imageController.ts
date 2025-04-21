import { Request, Response } from 'express';
import { ImageStatus } from '@prisma/client';
import * as imageService from '../services/imageService';
import * as batchService from '../services/batchService';

/**
 * Upload an image to a batch
 * POST /api/images
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { batchId, userId } = req.body;
    
    if (!batchId || !userId) {
      return res.status(400).json({ error: 'batchId and userId are required' });
    }
    
    // Check if batch exists
    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      return res.status(404).json({ error: `Batch with ID ${batchId} not found` });
    }
    
    const image = await imageService.createImage(req.file, batchId, userId);
    
    res.status(201).json({
      message: 'Image uploaded successfully and is being processed',
      image
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Upload multiple images to a batch
 * POST /api/images/batch-upload
 */
export async function uploadImages(req: Request, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    
    const { batchId, userId } = req.body;
    
    if (!batchId || !userId) {
      return res.status(400).json({ error: 'batchId and userId are required' });
    }
    
    // Check if batch exists
    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      return res.status(404).json({ error: `Batch with ID ${batchId} not found` });
    }
    
    const result = await imageService.createImages(req.files as Express.Multer.File[], batchId, userId);
    
    res.status(201).json({
      message: `${result.successCount} images uploaded successfully, ${result.errorCount} failed`,
      images: result.images,
      errors: result.errors,
      batch
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get all images
 * GET /api/images
 */
export async function getImages(req: Request, res: Response) {
  try {
    const { 
      userId,
      batchId,
      status, 
      page = '1', 
      limit = '10',
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await imageService.getImages({
      userId: userId as string,
      batchId: batchId as string,
      status: status as ImageStatus | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get images';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get images by user ID
 * GET /api/images/user/:userId
 */
export async function getImagesByUserId(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { 
      status, 
      page = '1', 
      limit = '10',
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await imageService.getImagesByUserId(userId, {
      status: status as ImageStatus | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting images by user ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get images';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get deleted images (admin function)
 * GET /api/images/deleted
 */
export async function getDeletedImages(req: Request, res: Response) {
  try {
    const { 
      userId,
      batchId,
      status, 
      page = '1', 
      limit = '10',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await imageService.getDeletedImages({
      userId: userId as string,
      batchId: batchId as string,
      status: status as ImageStatus | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting deleted images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get deleted images';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get an image by ID
 * GET /api/images/:id
 */
export async function getImageById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const image = await imageService.getImageById(id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json(image);
  } catch (error) {
    console.error('Error getting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get image';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Soft delete an image (mark as deleted)
 * PATCH /api/images/:id/soft-delete
 */
export async function softDeleteImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const deletedImage = await imageService.softDeleteImage(id);
    
    res.json({
      message: 'Image soft deleted successfully',
      image: deletedImage
    });
  } catch (error) {
    console.error('Error soft deleting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to soft delete image';
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Restore a soft-deleted image
 * PATCH /api/images/:id/restore
 */
export async function restoreImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const restoredImage = await imageService.restoreImage(id);
    
    res.json({
      message: 'Image restored successfully',
      image: restoredImage
    });
  } catch (error) {
    console.error('Error restoring image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to restore image';
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    
    if (errorMessage.includes('not deleted')) {
      return res.status(400).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Delete an image (hard delete)
 * DELETE /api/images/:id
 */
export async function deleteImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const deletedImage = await imageService.deleteImage(id);
    
    res.json({
      message: 'Image deleted successfully',
      image: deletedImage
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: errorMessage });
  }
}