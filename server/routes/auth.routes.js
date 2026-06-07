// Auth routes: register, login, OTP flows and protected profile endpoints.
const express = require('express');
const router = express.Router();
const { register, login, sendOtp, verifyOtp, resetPassword, updateProfile, updatePassword } = require('../controllers/auth.controller');
const protect = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected routes
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;