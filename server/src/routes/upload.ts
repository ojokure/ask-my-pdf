import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { pdfLoader } from '../services/pdfLoader';
import { vectorStore } from '../services/vectorStore';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { ValidationError, OpenAIQuotaError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (config.allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type. Only PDF files are allowed.'));
    }
  },
});

router.post('/', upload.single('pdf'), asyncHandler(async (req: Request, res: Response) => {
  const filePath = req.file?.path;
  
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  try {
    logger.info('Processing PDF upload', { filename: req.file.filename, size: req.file.size });
    
    // Load and process PDF
    const text = await pdfLoader.loadPDF(req.file.path);
    
    if (!text || text.trim().length === 0) {
      throw new ValidationError('PDF file appears to be empty or contains no extractable text');
    }

    // Generate embeddings and store in vector store
    const documentId = await vectorStore.addDocument(text, req.file.filename);
    logger.info('PDF processed successfully', { documentId, filename: req.file.filename });
    
    // Clean up uploaded file after successful processing
    if (filePath) {
      await fs.unlink(filePath).catch((err) => {
        logger.warn('Failed to delete uploaded file', { error: err, filePath });
      });
    }
    
    return successResponse(res, {
      documentId,
      filename: req.file.filename,
    }, 201, 'PDF uploaded and processed successfully');
  } catch (error: any) {
    // Clean up file on error as well
    if (filePath) {
      await fs.unlink(filePath).catch((err) => {
        logger.warn('Failed to delete uploaded file after error', { error: err, filePath });
      });
    }
    
    // Handle specific error types
    if (error?.message?.includes('quota') || error?.message?.includes('429') || error?.message?.includes('InsufficientQuotaError')) {
      throw new OpenAIQuotaError();
    }
    
    // Re-throw to be handled by error handler middleware
    throw error;
  }
}));

export default router;

