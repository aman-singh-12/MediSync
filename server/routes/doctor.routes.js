// Doctor routes: public and protected endpoints for doctor-related operations.
const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const {
	getAllDoctors,
	getDoctorById,
	getMyDoctorProfile,
	upsertDoctorProfile,
	deleteDoctorProfile,
	getDoctorStats,
	getMyReviews,
	addAvailableSlot,
	deleteAvailableSlot,
	getMyPatients,
	getPatientMedicalRecords,
	getAvailableSlotsByDate,
} = require('../controllers/doctor.controller');

router.get('/', getAllDoctors);
router.get('/:doctorId/available-slots', getAvailableSlotsByDate);
router.get('/profile/me', protect, authorizeRoles('doctor', 'admin'), getMyDoctorProfile);
router.get('/profile/me/stats', protect, authorizeRoles('doctor', 'admin'), getDoctorStats);
router.get('/reviews/me', protect, authorizeRoles('doctor'), getMyReviews);
router.get('/patients/me', protect, authorizeRoles('doctor'), getMyPatients);
router.get('/patients/:patientId/records', protect, authorizeRoles('doctor'), getPatientMedicalRecords);
router.post('/availability/slots', protect, authorizeRoles('doctor'), addAvailableSlot);
router.delete('/availability/slots/:slotId', protect, authorizeRoles('doctor'), deleteAvailableSlot);
router.post('/profile', protect, authorizeRoles('doctor', 'admin'), upsertDoctorProfile);
router.put('/profile', protect, authorizeRoles('doctor', 'admin'), upsertDoctorProfile);
router.delete('/profile/:id', protect, authorizeRoles('doctor', 'admin'), deleteDoctorProfile);
router.get('/:id', getDoctorById);

module.exports = router;
