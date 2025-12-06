# AskMyPDF - AI RAG Application

A full-stack application for AI-powered document question answering using Retrieval-Augmented Generation (RAG).

## Architecture

- **Frontend**: React/Next.js client application
- **Backend**: Node.js + TypeScript with LangChain
- **Vector Store**: FAISS for local embeddings storage
- **Features**: PDF upload, chunking, embeddings, retrieval, and AI chat

## Project Structure

```
/app
├── client/          # React/Next.js frontend
├── server/          # Node.js + TypeScript backend
├── docker-compose.yml
└── .github/         # CI/CD workflows
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Development

1. Clone the repository
2. Copy `.env.example` to `.env` in the server directory
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

### Docker

```bash
docker-compose up --build
```

## Features

- PDF document upload and processing
- Text chunking and embedding generation
- Vector store integration with FAISS
- RAG-based question answering
- Chat interface for document queries

## License

See LICENSE file for details.

