// Review routes: add reviews (protected) and fetch reviews for a doctor.
const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth.middleware'); // 👈 IMPORTANT (no {})
const { addReview, getDoctorReviews } = require('../controllers/review.controller');

router.post('/', protect, addReview);
router.get('/:doctorId', getDoctorReviews);

module.exports = router;