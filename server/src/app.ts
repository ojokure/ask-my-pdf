import express, { Express } from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload';
import chatRoutes from './routes/chat';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter, uploadLimiter, chatLimiter } from './middleware/rateLimiter';
import { config } from './config';
import { logger } from './utils/logger';

const app: Express = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Routes with specific rate limits
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'askmypdf-server',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

