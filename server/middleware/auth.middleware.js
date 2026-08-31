// Auth middleware: verify JWT token, attach `req.user`, and protect secure API routes.
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// ================= PROTECT ROUTE MIDDLEWARE =================
// Logic: Extracts Bearer JWT from Authorization header, decodes token, checks user existence, and attaches user to req
const protect = async (req, res, next) => {
  let token;

  // 1. Check for Authorization header starting with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract raw token string
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify JWT token signature and expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Fetch authenticated user from DB excluding password hash
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      // 5. Proceed to protected controller route handler
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token failed' });
    }
  }

  // 6. Return 401 if no Authorization header is present
  return res.status(401).json({ message: 'No token' });
};

// Supports both default and named imports
module.exports = protect;
module.exports.protect = protect;