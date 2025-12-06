# AskMyPDF Server

Node.js + TypeScript backend server for the AskMyPDF RAG application.

## Features

- PDF document upload and processing
- Text chunking and embedding generation using LangChain
- Vector store integration with FAISS
- RAG-based question answering
- RESTful API endpoints

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Set your OpenAI API key in `.env`:
   ```
   OPENAI_API_KEY=your_key_here
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/upload` - Upload and process PDF documents
- `POST /api/chat` - Ask questions about uploaded documents

## Project Structure

```
server/
├── src/
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic services
│   ├── utils/        # Utility functions
│   ├── app.ts        # Express app configuration
│   └── server.ts     # Server entry point
├── vector_store/     # FAISS vector store files
└── uploads/          # Uploaded PDF files
```

