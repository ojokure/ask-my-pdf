import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import path from 'path';
import fs from 'fs';
import { pdfLoader } from './pdfLoader';
import dotenv from 'dotenv';

dotenv.config();

class VectorStoreService {
  private storePath: string;
  private indexName: string;
  private vectorStore: FaissStore | null = null;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.storePath = process.env.VECTOR_STORE_PATH || './vector_store';
    this.indexName = process.env.VECTOR_STORE_INDEX_NAME || 'documents';
    
    // Ensure vector store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });
  }

  async initialize(): Promise<void> {
    try {
      const indexPath = path.join(this.storePath, this.indexName);
      if (fs.existsSync(indexPath)) {
        this.vectorStore = await FaissStore.load(indexPath, this.embeddings);
      } else {
        // Create new empty vector store
        this.vectorStore = await FaissStore.fromTexts(
          [''],
          [{ id: '0' }],
          this.embeddings
        );
        await this.vectorStore.save(indexPath);
      }
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw new Error('Failed to initialize vector store');
    }
  }

  async addDocument(text: string, documentId: string): Promise<string> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    try {
      // Chunk the text
      const chunks = await pdfLoader.chunkText(text);
      
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

      // Add documents to vector store
      await this.vectorStore!.addDocuments(documents);
      
      // Save the updated vector store
      const indexPath = path.join(this.storePath, this.indexName);
      await this.vectorStore!.save(indexPath);

      return documentId;
    } catch (error) {
      console.error('Error adding document to vector store:', error);
      throw new Error('Failed to add document to vector store');
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
        results = await this.vectorStore!.similaritySearchWithScore(query, k * 2);
        // Filter results by documentId
        results = results
          .map(([doc]) => doc)
          .filter(doc => doc.metadata.documentId === documentId)
          .slice(0, k);
      } else {
        results = await this.vectorStore!.similaritySearch(query, k);
      }

      return results;
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw new Error('Failed to perform similarity search');
    }
  }

  getVectorStore(): FaissStore | null {
    return this.vectorStore;
  }
}

export const vectorStore = new VectorStoreService();

