const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

// Demonstrate Event Loop
router.get('/event-loop', systemController.getEventLoopDemo);

module.exports = router;
