import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import path from 'path';
import fs from 'fs';
import { pdfLoader } from './pdfLoader';
import { config } from '../config';
import { logger } from '../utils/logger';
import { OpenAIQuotaError } from '../utils/errors';

class VectorStoreService {
  private storePath: string;
  private indexName: string;
  private vectorStore: FaissStore | null = null;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.storePath = config.vectorStorePath;
    this.indexName = config.vectorStoreIndexName;
    
    // Ensure vector store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
      logger.info('Created vector store directory', { path: this.storePath });
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async initialize(): Promise<void> {
    try {
      const indexPath = path.join(this.storePath, this.indexName);
      if (fs.existsSync(indexPath)) {
        this.vectorStore = await FaissStore.load(indexPath, this.embeddings);
      } else {
        // Don't create an empty vector store - it will be created when first document is added
        // Just mark as initialized but leave vectorStore as null
        // The first addDocument call will create it
        return;
      }
    } catch (error) {
      logger.error('Error initializing vector store', { error });
      throw new Error('Failed to initialize vector store');
    }
  }

  async addDocument(text: string, documentId: string): Promise<string> {
    try {
      // Chunk the text
      const chunks = await pdfLoader.chunkText(text);
      
      if (chunks.length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      // Create documents with metadata
      const documents = chunks.map((chunk, index) => 
        new Document({
          pageContent: chunk,
          metadata: {
            documentId,
            chunkIndex: index,
            totalChunks: chunks.length,
          },
        })
      );

      const indexPath = path.join(this.storePath, this.indexName);
      
      // If vector store doesn't exist, create it with the first document
      if (!this.vectorStore) {
        if (fs.existsSync(indexPath)) {
          this.vectorStore = await FaissStore.load(indexPath, this.embeddings);
          await this.vectorStore.addDocuments(documents);
        } else {
          // Create new vector store with first document
          this.vectorStore = await FaissStore.fromDocuments(documents, this.embeddings);
        }
      } else {
        // Add to existing vector store
        await this.vectorStore.addDocuments(documents);
      }
      
      // Save the updated vector store
      await this.vectorStore.save(indexPath);

      logger.info('Document added to vector store', { documentId, chunksCount: documents.length });
      return documentId;
    } catch (error: any) {
      logger.error('Error adding document to vector store', { error: error.message, documentId });
      
      // Handle OpenAI quota errors
      if (error?.message?.includes('quota') || error?.message?.includes('429') || error?.message?.includes('InsufficientQuotaError')) {
        throw new OpenAIQuotaError();
      }
      
      throw new Error(`Failed to add document to vector store: ${error?.message || 'Unknown error'}`);
    }
  }

  async similaritySearch(query: string, k: number = 4, documentId?: string): Promise<Document[]> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    try {
      let results: Document[];
      
      if (documentId) {
        // Filter by document ID if provided
        const resultsWithScore = await this.vectorStore!.similaritySearchWithScore(query, k * 2);
        // Filter results by documentId and extract documents from tuples
        results = resultsWithScore
          .map(([doc]) => doc)
          .filter(doc => doc.metadata.documentId === documentId)
          .slice(0, k);
      } else {
        results = await this.vectorStore!.similaritySearch(query, k);
      }

      return results;
    } catch (error) {
      logger.error('Error performing similarity search', { error, query: query.substring(0, 50) });
      throw new Error('Failed to perform similarity search');
    }
  }

  getVectorStore(): FaissStore | null {
    return this.vectorStore;
  }
}

export const vectorStore = new VectorStoreService();

