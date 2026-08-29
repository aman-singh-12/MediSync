const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

// Demonstrate Event Loop
router.get('/event-loop', systemController.getEventLoopDemo);

// Demonstrate JavaScript Hoisting
router.get('/hoisting', systemController.getHoistingDemo);

module.exports = router;
