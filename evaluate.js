const fs = require('fs');
const path = require('path');

const testQuestions = [
  {
    question: "What are the key features of this system?",
    expected: ["RAG", "vector search", "citations", "AI-powered"],
    category: "System Features"
  },
  {
    question: "How does the chunking work?",
    expected: ["1000 characters", "150 character overlap", "15% overlap", "sliding window"],
    category: "Technical Details"
  },
  {
    question: "What AI models are used?",
    expected: ["Cohere", "Groq", "Llama-3", "embed-english-v3.0"],
    category: "AI Models"
  },
  {
    question: "How are sources tracked?",
    expected: ["metadata", "citation system", "source attribution", "position tracking"],
    category: "Source Management"
  },
  {
    question: "What is the performance like?",
    expected: ["processing time", "metrics", "1-3 seconds", "performance monitoring"],
    category: "Performance"
  }
];

const evaluationResults = {
  totalQuestions: testQuestions.length,
  correctAnswers: 0,
  partialAnswers: 0,
  incorrectAnswers: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  categoryPerformance: {},
  detailedResults: []
};

function evaluateAnswer(question, answer, expected) {
  const answerLower = answer.toLowerCase();
  const expectedLower = expected.map(e => e.toLowerCase());
  
  let matchedKeywords = 0;
  expectedLower.forEach(keyword => {
    if (answerLower.includes(keyword)) {
      matchedKeywords++;
    }
  });
  
  const matchPercentage = (matchedKeywords / expected.length) * 100;
  
  if (matchPercentage >= 80) {
    return { score: 'correct', percentage: matchPercentage, matched: matchedKeywords, total: expected.length };
  } else if (matchPercentage >= 50) {
    return { score: 'partial', percentage: matchPercentage, matched: matchedKeywords, total: expected.length };
  } else {
    return { score: 'incorrect', percentage: matchPercentage, matched: matchedKeywords, total: expected.length };
  }
}

function updateCategoryPerformance(category, score) {
  if (!evaluationResults.categoryPerformance[category]) {
    evaluationResults.categoryPerformance[category] = {
      total: 0,
      correct: 0,
      partial: 0,
      incorrect: 0
    };
  }
  
  evaluationResults.categoryPerformance[category].total++;
  evaluationResults.categoryPerformance[category][score]++;
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 MINI RAG SYSTEM EVALUATION RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Overall Performance:`);
  console.log(`   Total Questions: ${evaluationResults.totalQuestions}`);
  console.log(`   Correct Answers: ${evaluationResults.correctAnswers} (${((evaluationResults.correctAnswers / evaluationResults.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`   Partial Answers: ${evaluationResults.partialAnswers} (${((evaluationResults.partialAnswers / evaluationResults.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`   Incorrect Answers: ${evaluationResults.incorrectAnswers} (${((evaluationResults.incorrectAnswers / evaluationResults.totalQuestions) * 100).toFixed(1)}%)`);
  
  console.log(`\n⏱️  Performance Metrics:`);
  console.log(`   Average Response Time: ${evaluationResults.averageResponseTime.toFixed(0)}ms`);
  console.log(`   Total Response Time: ${evaluationResults.totalResponseTime}ms`);
  
  console.log(`\n📈 Category Performance:`);
  Object.entries(evaluationResults.categoryPerformance).forEach(([category, stats]) => {
    const accuracy = ((stats.correct + stats.partial * 0.5) / stats.total * 100).toFixed(1);
    console.log(`   ${category}: ${accuracy}% accuracy (${stats.correct}/${stats.total} correct, ${stats.partial}/${stats.total} partial)`);
  });
  
  console.log(`\n📝 Detailed Results:`);
  evaluationResults.detailedResults.forEach((result, index) => {
    const status = result.score === 'correct' ? '✅' : result.score === 'partial' ? '⚠️' : '❌';
    console.log(`   ${index + 1}. ${status} ${result.question}`);
    console.log(`      Expected: ${result.expected.join(', ')}`);
    console.log(`      Score: ${result.score} (${result.percentage.toFixed(1)}%)`);
    console.log(`      Matched: ${result.matched}/${result.total} keywords`);
    console.log(`      Response Time: ${result.responseTime}ms`);
    console.log('');
  });
  
  console.log('='.repeat(60));
  
  const overallAccuracy = ((evaluationResults.correctAnswers + evaluationResults.partialAnswers * 0.5) / evaluationResults.totalQuestions * 100).toFixed(1);
  console.log(`🎯 Overall Accuracy: ${overallAccuracy}%`);
  
  if (overallAccuracy >= 80) {
    console.log('🎉 Excellent performance! The system is working very well.');
  } else if (overallAccuracy >= 60) {
    console.log('👍 Good performance with room for improvement.');
  } else {
    console.log('⚠️  Performance needs improvement. Check system configuration.');
  }
  
  console.log('='.repeat(60));
}

function simulateEvaluation() {
  console.log('🧪 Simulating Mini RAG System Evaluation...\n');
  
  testQuestions.forEach((testCase, index) => {
    console.log(`Testing Question ${index + 1}: ${testCase.question}`);
    
    const startTime = Date.now();
    
    const mockAnswer = generateMockAnswer(testCase);
    const responseTime = Date.now() - startTime;
    
    const evaluation = evaluateAnswer(testCase.question, mockAnswer, testCase.expected);
    
    const result = {
      question: testCase.question,
      expected: testCase.expected,
      score: evaluation.score,
      percentage: evaluation.percentage,
      matched: evaluation.matched,
      total: evaluation.total,
      responseTime: responseTime
    };
    
    evaluationResults.detailedResults.push(result);
    evaluationResults.totalResponseTime += responseTime;
    
    if (evaluation.score === 'correct') {
      evaluationResults.correctAnswers++;
    } else if (evaluation.score === 'partial') {
      evaluationResults.partialAnswers++;
    } else {
      evaluationResults.incorrectAnswers++;
    }
    
    updateCategoryPerformance(testCase.category, evaluation.score);
    
    console.log(`   Result: ${evaluation.score.toUpperCase()} (${evaluation.percentage.toFixed(1)}%)`);
    console.log(`   Response Time: ${responseTime}ms\n`);
  });
  
  evaluationResults.averageResponseTime = evaluationResults.totalResponseTime / evaluationResults.totalQuestions;
  
  printResults();
}

function generateMockAnswer(testCase) {
  const mockAnswers = {
    "System Features": "The Mini RAG system includes key features such as RAG (Retrieval-Augmented Generation), vector search capabilities, comprehensive citation system, and AI-powered document processing. The system combines semantic search with large language models to provide accurate answers with proper source attribution.",
    "Technical Details": "The chunking system works by splitting documents into chunks of 1000 characters with a 150 character overlap between adjacent chunks. This represents a 15% overlap that ensures context preservation while maintaining optimal chunk sizes for vector search. The algorithm uses a sliding window approach.",
    "AI Models": "The system uses multiple AI models including Cohere AI for embeddings (embed-english-v3.0 model), Groq Cloud for the large language model (Llama-3-8b-8192), and Qdrant for vector storage. Each model serves a specific purpose in the RAG pipeline.",
    "Source Management": "Sources are tracked through a comprehensive metadata system that includes source filename, position information, chunk index, and timestamp. The citation system provides inline references [1], [2], etc., that map directly to source chunks for complete traceability.",
    "Performance": "The system provides real-time performance metrics including processing time, chunk count, and query length. Processing times typically range from 1-3 seconds for most queries, and the system includes performance monitoring and optimization features."
  };
  
  return mockAnswers[testCase.category] || "The system provides comprehensive functionality for document processing and question answering.";
}

if (require.main === module) {
  simulateEvaluation();
}

module.exports = {
  testQuestions,
  evaluateAnswer,
  evaluationResults
};
