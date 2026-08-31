// Validator middleware: handles and formats validation errors from express-validator schemas.
const { validationResult } = require('express-validator');

// ================= VALIDATE REQUEST MIDDLEWARE =================
// Logic: Checks express-validator results; if validation errors exist, halts request and returns 400 with formatted error array
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
  }
  next();
};

module.exports = {
  validateRequest
};

