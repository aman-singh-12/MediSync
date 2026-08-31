// Rate Limiter middleware: prevents DDoS and brute force attacks using express-rate-limit.
const rateLimit = require('express-rate-limit');

// ================= AUTH RATE LIMITER =================
// Logic: Strict threshold (15 attempts / 15 min window) to protect login, register, and OTP verification against brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute time window
  max: 15, // Limit each IP to 15 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

// ================= GENERAL API RATE LIMITER =================
// Logic: General threshold (200 requests / 15 min window) for standard API queries and dashboard requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute time window
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};

