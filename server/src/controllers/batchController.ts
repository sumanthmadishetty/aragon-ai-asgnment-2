import { Request, Response } from 'express';
import { BatchStatus } from '@prisma/client';
import * as batchService from '../services/batchService';
import * as imageService from '../services/imageService';

/**
 * Create a new batch
 * POST /api/batches
 */
export async function createBatch(req: Request, res: Response) {
  try {
    const { name, userId, description } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }
    
    const batch = await batchService.createBatch({
      name,
      userId,
      description
    });
    
    res.status(201).json({
      message: 'Batch created successfully',
      batch
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create batch';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get all batches
 * GET /api/batches
 */
export async function getBatches(req: Request, res: Response) {
  try {
    const { 
      userId, 
      status, 
      page = '1', 
      limit = '10' 
    } = req.query;
    
    const result = await batchService.getBatches({
      userId: userId as string,
      status: status as BatchStatus,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting batches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get batches';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get batches by user ID
 * GET /api/batches/user/:userId
 */
export async function getBatchesByUserId(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '10' } = req.query;
    
    const result = await batchService.getBatchesByUserId(
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error getting batches by user ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get batches';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get a batch by ID
 * GET /api/batches/:id
 */
export async function getBatchById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const batch = await batchService.getBatchById(id);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(batch);
  } catch (error) {
    console.error('Error getting batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get batch';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get images in a batch
 * GET /api/batches/:id/images
 */
export async function getBatchImages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { 
      status, 
      page = '1', 
      limit = '10',
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Check if batch exists
    const batch = await batchService.getBatchById(id);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const result = await imageService.getImagesByBatchId(id, {
      status: status as any,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting batch images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get batch images';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Delete a batch
 * DELETE /api/batches/:id
 */
export async function deleteBatch(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const deletedBatch = await batchService.deleteBatch(id);
    
    res.json({
      message: 'Batch and associated images deleted successfully',
      batch: deletedBatch
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete batch';
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: errorMessage });
  }
}