import { Router, Request, Response } from 'express';
import { ragService } from '../services/rag';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateChatRequest } from '../middleware/validation';
import { successResponse } from '../utils/response';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

interface ChatRequest {
  question: string;
  documentId?: string;
}

router.post('/', 
  validateRequest(validateChatRequest),
  asyncHandler(async (req: Request<{}, {}, ChatRequest>, res: Response) => {
    const { question, documentId } = req.body;

    if (!question || question.trim().length === 0) {
      throw new ValidationError('Question is required');
    }

    logger.info('Processing chat query', { questionLength: question.length, documentId });

    // Get answer using RAG
    const answer = await ragService.query(question.trim(), documentId);

    logger.info('Chat query processed successfully', { questionLength: question.length });

    return successResponse(res, {
      question: question.trim(),
      answer,
    });
  })
);

export default router;

