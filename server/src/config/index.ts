import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
  
  // File Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(','),
  
  // Vector Store
  vectorStorePath: process.env.VECTOR_STORE_PATH || './vector_store',
  vectorStoreIndexName: process.env.VECTOR_STORE_INDEX_NAME || 'documents',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
} as const;

// Validate required configuration
if (!config.openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required but not set in environment variables');
}

