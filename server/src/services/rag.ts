import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { vectorStore } from './vectorStore';
import dotenv from 'dotenv';

dotenv.config();

class RAGService {
  private llm: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful assistant that answers questions based on the following context from documents.

Context:
{context}

Question: {question}

Please provide a detailed answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so.
`);
  }

  async query(question: string, documentId?: string): Promise<string> {
    try {
      // Initialize vector store if needed
      if (!vectorStore.getVectorStore()) {
        await vectorStore.initialize();
      }

      // Retrieve relevant documents
      const relevantDocs = await vectorStore.similaritySearch(question, 4, documentId);

      if (relevantDocs.length === 0) {
        return "I couldn't find any relevant information in the uploaded documents to answer your question.";
      }

      // Combine context from retrieved documents
      const context = relevantDocs
        .map(doc => doc.pageContent)
        .join('\n\n');

      // Generate prompt
      const prompt = await this.promptTemplate.format({
        context,
        question,
      });

      // Get answer from LLM
      const response = await this.llm.invoke(prompt);
      
      return response.content as string;
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw new Error('Failed to process RAG query');
    }
  }
}

export const ragService = new RAGService();

