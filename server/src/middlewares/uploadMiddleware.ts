import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import config from '../config/app';

// Define memory storage for multer
const storage = multer.memoryStorage();

// Create multer instance with memory storage
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // Max file size in bytes
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`));
    }
    
    cb(null, true);
  },
});

// Error handling middleware for multer
export function handleMulterError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred during file upload
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB`
      });
    }
    
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // A different error occurred
    return res.status(400).json({ error: err.message });
  }
  
  next();
}

// Export middleware for single file upload
export const uploadSingle = upload.single('image');