// Patient routes: profile, dashboard and saved doctors for patient users.
const express = require('express');

const router = express.Router();
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const {
	getMyPatientProfile,
	upsertPatientProfile,
	getPatientDashboard,
	getSavedDoctors,
	addSavedDoctor,
	removeSavedDoctor,
} = require('../controllers/patient.controller');

router.get('/me', protect, authorizeRoles('patient'), getMyPatientProfile);
router.put('/me', protect, authorizeRoles('patient'), upsertPatientProfile);
router.get('/dashboard', protect, authorizeRoles('patient'), getPatientDashboard);
router.get('/saved-doctors', protect, authorizeRoles('patient'), getSavedDoctors);
router.post('/saved-doctors/:doctorId', protect, authorizeRoles('patient'), addSavedDoctor);
router.delete('/saved-doctors/:doctorId', protect, authorizeRoles('patient'), removeSavedDoctor);

module.exports = router;
