import express from 'express';
import imageRoutes from './imageRoutes';
import batchRoutes from './batchRoutes';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/images', imageRoutes);
router.use('/batches', batchRoutes);

export default router;