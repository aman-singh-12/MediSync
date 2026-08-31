const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

// Demonstrate JavaScript Event Loop (0.1 pts)
router.get('/event-loop', systemController.getEventLoopDemo);

// Demonstrate JavaScript Hoisting (0.1 pts)
router.get('/hoisting', systemController.getHoistingDemo);

// Demonstrate JavaScript Promises vs Callbacks (0.1 pts)
router.get('/promises-vs-callbacks', systemController.getPromisesVsCallbacksDemo);

// Run all pedagogical demos in single endpoint
router.get('/all-demos', systemController.getAllDemos);

module.exports = router;
