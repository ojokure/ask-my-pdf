import { Router, Request, Response } from 'express';
import { ragService } from '../services/rag';

const router = Router();

interface ChatRequest {
  question: string;
  documentId?: string;
}

router.post('/', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get answer using RAG
    const answer = await ragService.query(question, documentId);

    res.json({
      success: true,
      question,
      answer,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

export default router;

