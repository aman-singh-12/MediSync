// Appointment routes: booking and appointment management for patients, doctors, admins.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { validateRequest } = require('../middleware/validator.middleware');

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
router.post(
  '/book',
  protect,
  authorizeRoles('patient'),
  [
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('reason').optional().isString(),
    validateRequest
  ],
  bookAppointment
);
router.get('/my', protect, getMyAppointments);
router.put('/cancel/:id', protect, cancelAppointment);
router.put(
  '/reschedule/:id',
  protect,
  [
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    validateRequest
  ],
  rescheduleAppointment
);

// Doctor routes
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorAppointments);
router.put(
  '/status/:id',
  protect,
  authorizeRoles('doctor', 'admin'),
  [
    body('status').isIn(['confirmed', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
    validateRequest
  ],
  updateAppointmentStatus
);

// Admin routes
router.get('/all', protect, authorizeRoles('admin'), getAllAppointments);

module.exports = router;