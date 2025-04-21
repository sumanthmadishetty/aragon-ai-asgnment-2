import express from 'express';
import * as imageController from '../controllers/imageController';
import { uploadSingle, handleMulterError } from '../middlewares/uploadMiddleware';
import multer from 'multer';
import config from '../config/app';

const router = express.Router();

// Setup multer for multiple file uploads
const storage = multer.memoryStorage();
const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // Max file size in bytes
    files: 20 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`));
    }
    
    cb(null, true);
  },
}).array('images', 20); // 'images' is the field name, 20 is the max count

// POST /api/images - Upload a single image
router.post('/', uploadSingle, handleMulterError, imageController.uploadImage);

// POST /api/images/batch-upload - Upload multiple images
router.post('/batch-upload', (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB`
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: `Too many files. Maximum is 20 files per upload`
          });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, imageController.uploadImages);

// GET /api/images - Get all images with filtering
router.get('/', imageController.getImages);

// GET /api/images/deleted - Get soft-deleted images (admin function)
router.get('/deleted', imageController.getDeletedImages);

// GET /api/images/user/:userId - Get images by user ID
router.get('/user/:userId', imageController.getImagesByUserId);

// GET /api/images/:id - Get an image by ID
router.get('/:id', imageController.getImageById);

// PATCH /api/images/:id/soft-delete - Soft delete an image
router.patch('/:id/soft-delete', imageController.softDeleteImage);

// PATCH /api/images/:id/restore - Restore a soft-deleted image
router.patch('/:id/restore', imageController.restoreImage);

// DELETE /api/images/:id - Hard delete an image
router.delete('/:id', imageController.deleteImage);

export default router;