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
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    // console.log('API Key:', apiKey);
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.storePath = process.env.VECTOR_STORE_PATH || './vector_store';
    this.indexName = process.env.VECTOR_STORE_INDEX_NAME || 'documents';
    
    // Ensure vector store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
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
      console.error('Error initializing vector store:', error);
      console.error('API Key present:', !!process.env.OPENAI_API_KEY);
      console.error('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
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

      return documentId;
    } catch (error: any) {
      console.error('Error adding document to vector store:', error);
      
      // Provide more helpful error messages
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing and quota limits. You may need to upgrade your plan or wait for your quota to reset.');
      }
      
      if (error?.message?.includes('InsufficientQuotaError')) {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing and quota limits.');
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
      console.error('Error performing similarity search:', error);
      throw new Error('Failed to perform similarity search');
    }
  }

  getVectorStore(): FaissStore | null {
    return this.vectorStore;
  }
}

export const vectorStore = new VectorStoreService();

