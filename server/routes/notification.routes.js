// Notification routes: create and retrieve user notifications (admin and user endpoints).
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const {
	getMyNotifications,
	markAsRead,
	markAllAsRead,
	createNotification,
} = require('../controllers/notification.controller');

router.post('/', protect, authorizeRoles('admin'), createNotification);
router.get('/', protect, getMyNotifications);
router.get('/my', protect, getMyNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
