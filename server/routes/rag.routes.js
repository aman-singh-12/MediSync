const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Helper to safely load RAG service dynamically
const getRagService = () => {
  return require('../ai/rag/rag.service');
};

// POST /api/rag/query
router.post('/query', protect, async (req, res) => {
  try {
    const { question, chatHistory } = req.body;
    const role = req.user?.role || 'patient';
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const { generateAnswer } = getRagService();
    const result = await generateAnswer(question, chatHistory || [], role);
    res.json(result);
  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({ message: 'Error processing your question', error: error.message });
  }
});

// POST /api/rag/query-stream
router.post('/query-stream', protect, async (req, res) => {
  try {
    const { question, chatHistory } = req.body;
    const role = req.user?.role || 'patient';
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { generateAnswerStream } = getRagService();
    const { stream, sources } = await generateAnswerStream(question, chatHistory || [], role);

    // Send sources first as a distinct event
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    // Iterate over stream chunks
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('RAG stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
