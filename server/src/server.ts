import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { closeRedisConnection } from './services/redis';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, { 
    port: PORT, 
    environment: config.nodeEnv 
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await closeRedisConnection();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

