import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../services/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import crypto from 'crypto';

interface IdempotencyCache {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

/**
 * Generates an idempotency key from request
 * Uses Idempotency-Key header if provided, otherwise generates from request body
 */
const generateIdempotencyKey = (req: Request): string => {
  // Check for Idempotency-Key header first
  const headerKey = req.headers['idempotency-key'] as string;
  if (headerKey) {
    return `idempotency:${headerKey}`;
  }

  // Generate key from request body and path
  const bodyString = JSON.stringify(req.body || {});
  const path = req.path;
  const hash = crypto.createHash('sha256').update(`${req.method}:${path}:${bodyString}`).digest('hex');
  return `idempotency:${hash}`;
};

/**
 * Middleware to handle idempotency using Redis
 * Stores request/response pairs and returns cached responses for duplicate requests
 */
export const idempotencyMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to POST, PUT, PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    try {
      const redis = getRedisClient();
      const idempotencyKey = generateIdempotencyKey(req);

      // Check if we have a cached response
      const cached = await redis.get(idempotencyKey);
      
      if (cached) {
        const cachedData: IdempotencyCache = JSON.parse(cached);
        logger.info('Returning cached idempotent response', { 
          idempotencyKey: idempotencyKey.substring(0, 20) + '...',
          timestamp: cachedData.timestamp 
        });

        // Set cached headers
        Object.entries(cachedData.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Return cached response
        return res.status(cachedData.statusCode).json(cachedData.body);
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override res.json to capture response
      res.json = function(body: any) {
        // Store response in Redis
        const cacheData: IdempotencyCache = {
          statusCode: res.statusCode,
          headers: {
            'content-type': res.getHeader('content-type') as string || 'application/json',
          },
          body,
          timestamp: Date.now(),
        };

        // Store in Redis with TTL
        redis.setex(
          idempotencyKey,
          config.idempotencyTtl,
          JSON.stringify(cacheData)
        ).catch((err) => {
          logger.error('Failed to cache idempotent response', { 
            error: err.message,
            idempotencyKey: idempotencyKey.substring(0, 20) + '...'
          });
        });

        logger.info('Cached idempotent response', { 
          idempotencyKey: idempotencyKey.substring(0, 20) + '...',
          statusCode: res.statusCode 
        });

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error: any) {
      logger.error('Idempotency middleware error', { error: error.message });
      // If Redis fails, continue without idempotency (fail open)
      next();
    }
  };
};
