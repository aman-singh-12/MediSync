// Payment routes: create payments and fetch authenticated user's payments.
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { createPayment, getMyPayments, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/payment.controller');

router.get('/my', protect, getMyPayments);
router.post('/', protect, createPayment);
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);

module.exports = router;
