#### Project created by Mukesh Ahirwar
Resume :
https://drive.google.com/file/d/1CxdBV1x_i-TZCLgqi7elyW1kqfB7tYjE/view?usp=sharing

# Mini RAG - AI-Powered Document Q&A

A production-ready RAG (Retrieval-Augmented Generation) application that allows users to upload documents, ask questions, and receive AI-generated answers with proper citations and source tracking.

##  Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Qdrant Cloud  │    │   Cohere AI     │
                       │   Vector DB     │    │   Embeddings    │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Document      │    │   Groq Cloud    │
                       │   Chunking      │    │   LLM (Llama)   │
                       └─────────────────┘    └─────────────────┘
```

## Features

- **Document Processing**: Upload files or paste text directly
- **Smart Chunking**: Configurable chunk size with overlap for context preservation
- **Vector Search**: Semantic search using Cohere embeddings
- **Reranking**: Cohere reranker for improved relevance
- **AI Answers**: Groq Cloud LLM with inline citations
- **Source Tracking**: Complete source attribution with metadata
- **Performance Metrics**: Request timing and processing statistics
- **Modern UI**: Responsive design with beautiful gradients

## Technology Stack

### Backend
- **Runtime**: Node.js with Express
- **Vector Database**: Qdrant Cloud (free tier)
- **Embeddings**: Cohere AI (free tier - 100 requests/month)
- **LLM**: Groq Cloud (free tier - Llama-3-8b-8192)
- **File Processing**: Multer for file uploads

### Frontend
- **Framework**: Vanilla JavaScript
- **Styling**: CSS3 with modern gradients and animations
- **Responsive**: Mobile-first design approach

## Configuration

### Chunking Strategy
- **Chunk Size**: 1000 characters
- **Overlap**: 150 characters (15% overlap)
- **Strategy**: Sliding window with position tracking

### Vector Database
- **Collection**: `mini_rag_docs`
- **Dimensions**: 1024 (Cohere embed-english-v3.0)
- **Distance Metric**: Cosine similarity
- **Index Type**: HNSW (default)

### Retrieval & Reranking
- **Initial Retrieval**: Top 8 chunks from vector search
- **Reranking**: Cohere rerank-english-v2.0
- **Final Results**: Top 5 reranked chunks

### LLM Configuration
- **Model**: Llama-3-8b-8192 (Groq Cloud)
- **Temperature**: 0.1 (deterministic responses)
- **Max Tokens**: 1000
- **Prompt Engineering**: Context-aware with citation formatting

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- API keys for:
  - Qdrant Cloud
  - Cohere AI
  - Groq Cloud

### 2. Installation
```bash
git clone <repository-url>
cd mini-rag2
npm install
```

### 3. Environment Setup
Copy `env.example` to `.env` and fill in your API keys:
```bash
cp env.example .env
```

Edit `.env` with your actual API keys:
```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

### 4. Run the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

### 5. Usage
1. **Upload Documents**: Either upload a file or paste text
2. **Ask Questions**: Type your question in the query box
3. **Get Answers**: Receive AI-generated answers with citations
4. **Review Sources**: Examine the source chunks used for answers

## API Endpoints

### POST `/api/upload`
Upload documents or text for processing.

**Request**:
- File upload via `multipart/form-data`
- Or JSON with `text` field

**Response**:
```json
{
  "message": "Document processed successfully",
  "chunks": 5,
  "filename": "document.txt"
}
```

### POST `/api/query`
Query the knowledge base.

**Request**:
```json
{
  "query": "What is the main topic?"
}
```

**Response**:
```json
{
  "answer": "The main topic is... [1]",
  "sources": [...],
  "processingTime": 1250,
  "chunkCount": 5
}
```

### GET `/api/health`
Health check endpoint.

## Evaluation & Testing

### Sample Q&A Pairs for Testing

1. **Question**: "What are the key features of this system?"
   - **Expected**: Should mention RAG, vector search, citations
   - **Success Criteria**: Answer includes system capabilities

2. **Question**: "How does the chunking work?"
   - **Expected**: Should explain 1000 char chunks with 150 char overlap
   - **Success Criteria**: Technical details about chunking strategy

3. **Question**: "What AI models are used?"
   - **Expected**: Should mention Cohere embeddings, Groq LLM
   - **Success Criteria**: Model names and purposes

4. **Question**: "How are sources tracked?"
   - **Expected**: Should explain metadata storage and citation system
   - **Success Criteria**: Understanding of source attribution

5. **Question**: "What is the performance like?"
   - **Expected**: Should mention processing times and metrics
   - **Success Criteria**: Performance awareness

### Success Metrics
- **Precision**: 80%+ of answers should be factually correct
- **Recall**: 70%+ of relevant information should be retrieved
- **Response Time**: <3 seconds for typical queries
- **Citation Accuracy**: 90%+ of citations should map to correct sources

## Deployment

### Freely hosted on

1. **Render**
   - Free tier with 750 hours/month
   - Easy deployment from GitHub
   - Automatic environment variable management

## Security Considerations

- API keys stored server-side only
- CORS enabled for development
- Input validation on all endpoints
- File size limits enforced
- No sensitive data logging

## Remarks & Trade-offs

### Provider Limits
- **Cohere Free Tier**: 100 requests/month for embeddings
- **Groq Free Tier**: 100 requests/minute for LLM
- **Qdrant Cloud**: 1GB storage, 1000 requests/minute

### Design Decisions
- **Chunk Size**: 1000 chars balances context vs. precision
- **Overlap**: 15% ensures context continuity
- **Reranking**: Applied after vector search for quality
- **Citations**: Inline format [1], [2] for readability

### Performance Optimizations
- Batch embedding generation
- Efficient chunking algorithm
- Connection pooling for database
- Response caching (future enhancement)


