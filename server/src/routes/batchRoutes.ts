import express from 'express';
import * as batchController from '../controllers/batchController';

const router = express.Router();

// POST /api/batches - Create a new batch
router.post('/', batchController.createBatch);

// GET /api/batches - Get all batches with filtering and pagination
router.get('/', batchController.getBatches);

// GET /api/batches/user/:userId - Get batches by user ID
router.get('/user/:userId', batchController.getBatchesByUserId);

// GET /api/batches/:id - Get a batch by ID
router.get('/:id', batchController.getBatchById);

// GET /api/batches/:id/images - Get images in a batch
router.get('/:id/images', batchController.getBatchImages);

// DELETE /api/batches/:id - Delete a batch and its images
router.delete('/:id', batchController.deleteBatch);

export default router;