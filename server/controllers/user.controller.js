// User controller: endpoints to fetch/update the current user and upload profile pictures.
const User = require('../models/user.model');

// ================= GET ME =================
// Logic: Retrieves current logged-in user's profile excluding password hash
const getMe = async (req, res) => {
  try {
    // 1. Fetch user by token ID
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE ME =================
// Logic: Updates basic profile fields (name, phone) for authenticated user
const updateMe = async (req, res) => {
  try {
    // 1. Extract updated attributes
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    // 2. Save and return updated data
    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPLOAD PROFILE PICTURE =================
// Logic: Receives uploaded avatar image from Multer/Cloudinary, updates user's profilePicture URL
const uploadProfilePicture = async (req, res) => {
  try {
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 2. Save Cloudinary image URL to user document
    const user = await User.findById(req.user._id);
    user.profilePicture = req.file.path; // Cloudinary secure URL
    await user.save();

    res.json({
      message: 'Profile picture updated',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMe, updateMe, uploadProfilePicture };