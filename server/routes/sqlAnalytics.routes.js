const express = require('express');
const router = express.Router();
const sqlAnalyticsController = require('../controllers/sqlAnalytics.controller');

// Initialize schema (creates tables, PK/FK, constraints and inserts dummy data)
router.post('/init', sqlAnalyticsController.initSchema);

// Schema specifications & Normalization proof (0.2 pts)
router.get('/schema', sqlAnalyticsController.getSchemaDetails);

// Demonstrate individual SQL JOINs (0.2 pts)
router.get('/joins/inner', sqlAnalyticsController.getInnerJoinDemo);
router.get('/joins/left', sqlAnalyticsController.getLeftJoinDemo);
router.get('/joins/right', sqlAnalyticsController.getRightJoinDemo);
router.get('/joins/full', sqlAnalyticsController.getFullJoinDemo);
router.get('/joins/cross', sqlAnalyticsController.getCrossJoinDemo);
router.get('/joins/self', sqlAnalyticsController.getSelfJoinDemo);

// Demonstrate all SQL JOINs side-by-side (0.2 pts)
router.get('/joins/all', sqlAnalyticsController.getAllJoinsComparison);

// Legacy route compatibility
router.get('/doctors-with-departments', sqlAnalyticsController.getInnerJoinDemo);

// Demonstrate Aggregate logic (WHERE, GROUP BY, HAVING, ORDER BY)
router.get('/appointment-stats', sqlAnalyticsController.getAppointmentStats);

module.exports = router;
