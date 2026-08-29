// Auth routes: register, login, OTP flows and protected profile endpoints.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, sendOtp, verifyOtp, resetPassword, updateProfile, updatePassword } = require('../controllers/auth.controller');
const protect = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validator.middleware');

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
    validateRequest
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  login
);

router.post(
  '/send-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    validateRequest
  ],
  sendOtp
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validateRequest
  ],
  verifyOtp
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    validateRequest
  ],
  resetPassword
);

// Protected routes
router.put(
  '/profile',
  protect,
  [
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validateRequest
  ],
  updateProfile
);

router.put(
  '/update-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validateRequest
  ],
  updatePassword
);

module.exports = router;