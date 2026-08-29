const express = require('express');
const router = express.Router();
const sqlAnalyticsController = require('../controllers/sqlAnalytics.controller');

// Initialize schema (creates tables and inserts dummy data)
router.post('/init', sqlAnalyticsController.initSchema);

// Demonstrate JOINs
router.get('/doctors-with-departments', sqlAnalyticsController.getDoctorsWithDepartments);

// Demonstrate Aggregate logic (WHERE, GROUP BY, HAVING, ORDER BY)
router.get('/appointment-stats', sqlAnalyticsController.getAppointmentStats);

module.exports = router;
