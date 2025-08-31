const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { QdrantClient } = require('@qdrant/js-client-rest');
const cohere = require('cohere-ai');
const Groq = require('groq-sdk');
const { encoding_for_model } = require('tiktoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
    files: 1
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Create Cohere client with API key
const cohereClient = new cohere.CohereClient({
  token: process.env.COHERE_API_KEY,
});

const COLLECTION_NAME = 'mini_rag_docs';
const EMBEDDING_DIMENSION = 1024;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

async function initializeQdrant() {
  try {
    const collections = await qdrant.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: 'Cosine',
        },
      });
      console.log('Qdrant collection created');
    }
  } catch (error) {
    console.error('Error initializing Qdrant:', error);
  }
}

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  const maxChunks = 90; // Stay within Cohere's 96 text limit
  
  while (start < text.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    chunks.push({
      text: chunk,
      start,
      end,
      id: uuidv4(),
    });
    
    start = end - overlap;
    if (start >= text.length) break;
    
    // Safety check to prevent infinite loops
    if (start >= end) break;
  }

  return chunks;
}

async function getEmbeddings(texts) {
  try {
    const batchSize = 96; // Cohere's limit
    const allEmbeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      const response = await cohereClient.embed({
        texts: batch,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
      });
      
      allEmbeddings.push(...response.embeddings);
    }
    
    return allEmbeddings;
  } catch (error) {
    console.error('Error getting embeddings:', error);
    throw error;
  }
}

async function storeDocument(text, filename = 'pasted_text') {
  try {
    // Limit text size to prevent memory issues
    const maxTextLength = 100000; // 100KB limit
    if (text.length > maxTextLength) {
      text = text.substring(0, maxTextLength);
      console.log(`Text truncated to ${maxTextLength} characters to prevent memory issues`);
    }
    
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks from text`);
    
    if (chunks.length === 0) {
      throw new Error('No chunks created from text');
    }
    
    const chunkTexts = chunks.map(chunk => chunk.text);
    
    console.log('Getting embeddings...');
    const embeddings = await getEmbeddings(chunkTexts);
    console.log(`Got ${embeddings.length} embeddings`);
    
    const points = chunks.map((chunk, index) => ({
      id: chunk.id,
      vector: embeddings[index],
      payload: {
        text: chunk.text,
        source: filename,
        start: chunk.start,
        end: chunk.end,
        chunk_index: index,
        timestamp: new Date().toISOString(),
      },
    }));

    console.log('Upserting to Qdrant...');
    await qdrant.upsert(COLLECTION_NAME, {
      points,
    });
    
    console.log('Document stored successfully');
    return chunks.length;
  } catch (error) {
    console.error('Error in storeDocument:', error);
    throw error;
  }
}

async function searchDocuments(query, topK = 5) {
  const queryEmbedding = await getEmbeddings([query]);
  
  const searchResults = await qdrant.search(COLLECTION_NAME, {
    vector: queryEmbedding[0],
    limit: topK * 2,
    withPayload: true,
  });

  return searchResults;
}

async function rerankResults(query, searchResults, topK = 5) {
  const documents = searchResults.map(result => ({
    text: result.payload.text,
    id: result.id,
    score: result.score,
  }));

  try {
    const rerankResponse = await cohereClient.rerank({
      query,
      documents: documents.map(doc => doc.text),
      topN: topK,
      model: 'rerank-english-v3.0',
    });

    const rerankedResults = rerankResponse.results.map((result, index) => ({
      ...documents[result.index],
      rerankScore: result.relevanceScore,
      finalRank: index + 1,
    }));

    return rerankedResults.slice(0, topK);
  } catch (error) {
    console.error('Reranking failed, using original results:', error);
    return searchResults.slice(0, topK).map((result, index) => ({
      ...result.payload,
      id: result.id,
      score: result.score,
      finalRank: index + 1,
    }));
  }
}

async function generateAnswer(query, contextChunks) {
  const context = contextChunks
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join('\n\n');

  const prompt = `You are a helpful AI assistant. Answer the user's question based on the provided context. Use inline citations [1], [2], etc. to reference the source chunks. If the context doesn't contain enough information to answer the question, say so clearly.

Context:
${context}

Question: ${query}

Answer:`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer:', error);
    return 'Sorry, I encountered an error while generating the answer.';
  }
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    let text = '';
    let filename = 'pasted_text';

    if (req.file) {
      text = req.file.buffer.toString('utf-8');
      filename = req.file.originalname;
      console.log(`Processing file: ${filename}, size: ${text.length} characters`);
    } else if (req.body.text) {
      text = req.body.text;
      console.log(`Processing pasted text, size: ${text.length} characters`);
    } else {
      return res.status(400).json({ error: 'No text or file provided' });
    }

    // Validate text length
    if (text.length === 0) {
      return res.status(400).json({ error: 'Text is empty' });
    }

    if (text.length > 100000) {
      return res.status(400).json({ 
        error: 'Text too long. Maximum 100,000 characters allowed.',
        currentLength: text.length,
        maxLength: 100000
      });
    }

    console.log('Starting document processing...');
    const chunkCount = await storeDocument(text, filename);
    
    res.json({ 
      message: 'Document processed successfully', 
      chunks: chunkCount,
      filename 
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process document';
    if (error.message.includes('QDRANT')) {
      errorMessage = 'Database connection error. Please check your Qdrant configuration.';
    } else if (error.message.includes('COHERE')) {
      errorMessage = 'Embedding service error. Please check your Cohere API key.';
    } else if (error.message.includes('memory')) {
      errorMessage = 'Document too large. Please try with a smaller document.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const startTime = Date.now();
    
    const searchResults = await searchDocuments(query, 8);
    const rerankedResults = await rerankResults(query, searchResults, 5);
    const answer = await generateAnswer(query, rerankedResults);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    const sources = rerankedResults.map((chunk, index) => ({
      id: index + 1,
      text: chunk.text,
      source: chunk.source || 'Unknown',
      start: chunk.start || 0,
      end: chunk.end || 0,
      score: chunk.score || 0,
      rerankScore: chunk.rerankScore || 0,
    }));

    res.json({
      answer,
      sources,
      processingTime,
      query,
      chunkCount: rerankedResults.length,
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await qdrant.getCollections();
    res.json({ status: 'healthy', qdrant: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initializeQdrant();
  app.listen(PORT, () => {
    console.log(`Mini RAG server running on port ${PORT}`);
  });
}

startServer();
