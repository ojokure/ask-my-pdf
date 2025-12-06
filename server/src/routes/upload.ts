import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { pdfLoader } from '../services/pdfLoader';
import { embeddings } from '../services/embeddings';
import { vectorStore } from '../services/vectorStore';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  },
});

router.post('/', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Load and process PDF
    const text = await pdfLoader.loadPDF(req.file.path);
    
    // Generate embeddings and store in vector store
    const documentId = await vectorStore.addDocument(text, req.file.filename);
    
    res.json({
      success: true,
      documentId,
      filename: req.file.filename,
      message: 'PDF uploaded and processed successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

export default router;

