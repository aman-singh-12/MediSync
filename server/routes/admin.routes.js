// Admin routes: endpoints restricted to admin users for management and reporting.
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

// All routes require admin role
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', adminController.getAdminDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/doctors', adminController.getAllDoctors);
router.put('/doctors/:id/approve', adminController.approveDoctor);
router.put('/doctors/:id/reject', adminController.rejectDoctor);
router.get('/appointments', adminController.getAllAppointments);
router.get('/payment-stats', adminController.getPaymentStats);
router.get('/payments', adminController.getAllPayments);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
