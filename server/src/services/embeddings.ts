import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../config';
import { logger } from '../utils/logger';

class EmbeddingsService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddings.embedQuery(text);
      return result;
    } catch (error) {
      logger.error('Error generating embedding', { error });
      throw new Error('Failed to generate embedding');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const results = await this.embeddings.embedDocuments(texts);
      return results;
    } catch (error) {
      logger.error('Error generating embeddings', { error, count: texts.length });
      throw new Error('Failed to generate embeddings');
    }
  }
}

export const embeddings = new EmbeddingsService();

