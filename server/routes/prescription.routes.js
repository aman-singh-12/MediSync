// Prescription routes: create and view prescriptions for patients and doctors.
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const {
	createPrescription,
	getMyPrescriptions,
	getDoctorPrescriptions,
	getPrescriptionById,
} = require('../controllers/prescription.controller');

router.post('/', protect, authorizeRoles('doctor'), createPrescription);
router.get('/my', protect, authorizeRoles('patient'), getMyPrescriptions);
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorPrescriptions);
router.get('/:id', protect, getPrescriptionById);

module.exports = router;
