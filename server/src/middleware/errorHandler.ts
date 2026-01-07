import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // If it's an operational error (AppError), send the error message
  if (err instanceof AppError && err.isOperational) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // For unexpected errors, don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment 
    ? err.message || 'Internal server error'
    : 'Internal server error';

  return errorResponse(res, message, 500);
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

