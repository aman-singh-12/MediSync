// Appointment routes: booking and appointment management for patients, doctors, admins.
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAllAppointments,
} = require('../controllers/appointment.controller');

// Patient routes
router.post('/book', protect, authorizeRoles('patient'), bookAppointment);
router.get('/my', protect, getMyAppointments);
router.put('/cancel/:id', protect, cancelAppointment);
router.put('/reschedule/:id', protect, rescheduleAppointment);

// Doctor routes
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorAppointments);
router.put('/status/:id', protect, authorizeRoles('doctor', 'admin'), updateAppointmentStatus);

// Admin routes
router.get('/all', protect, authorizeRoles('admin'), getAllAppointments);

module.exports = router;