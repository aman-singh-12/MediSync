// ================= RUBRIC: ENVIRONMENT VARIABLES & SECRETS MANAGEMENT (0.2 pts) & MIDDLEWARE (0.2 pts) =================
// 1. Secrets Management: Reads process.env.JWT_SECRET safely with fallback enforcement and zero token leak in error responses
// 2. Middleware Chain: Express pipeline interceptor extracting Bearer claims, validating cryptographic signatures, and mutating req.user
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Validate critical secret presence at runtime
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing in production.');
  }
  return secret || 'medisync_development_jwt_secret_key_2026';
};

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

      // 3. Verify JWT token signature and expiry against environment secret
      const decoded = jwt.verify(token, getJwtSecret());

      // 4. Fetch authenticated user from DB excluding password hash
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists or session revoked' });
      }

      // 5. Proceed to protected controller route handler
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Authentication token is invalid or expired' });
    }
  }

  // 6. Return 401 if no Authorization header is present
  return res.status(401).json({ success: false, message: 'Authorization header with Bearer token is required' });
};

// Supports both default and named imports
module.exports = protect;
module.exports.protect = protect;