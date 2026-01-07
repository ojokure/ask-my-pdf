import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, { 
    port: PORT, 
    environment: config.nodeEnv 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

