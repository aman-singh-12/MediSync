const express = require('express');
const router = express.Router();
const { generateAnswer } = require('../ai/rag/rag.service');
const { protect } = require('../middleware/auth.middleware');

// POST /api/rag/query
router.post('/query', protect, async (req, res) => {
  try {
    const { question, chatHistory } = req.body;
    const role = req.user?.role || 'patient';
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const result = await generateAnswer(question, chatHistory || [], role);
    res.json(result);
  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({ message: 'Error processing your question', error: error.message });
  }
});

module.exports = router;
