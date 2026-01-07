import { body, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { errorResponse } from '../utils/response';

export const validateChatRequest: ValidationChain[] = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters')
    .escape(),
  body('documentId')
    .optional()
    .isString()
    .withMessage('Document ID must be a string')
    .trim()
    .escape(),
];

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
      }));
      
      return errorResponse(res, 'Validation failed', 400, errorMessages);
    }

    next();
  };
};

