// User routes: endpoints for current user profile and uploading profile pictures.
const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth.middleware');
const { getMe, updateMe, uploadProfilePicture } = require('../controllers/user.controller');
const { uploadCloud } = require('../utils/cloudinary');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/upload-profile-picture', protect, uploadCloud.single('profilePicture'), uploadProfilePicture);

module.exports = router;