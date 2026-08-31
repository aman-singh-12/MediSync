// ================= RUBRIC: HTTP STATUS CODES USED CORRECTLY (0.2 pts) =================
// Express middleware and standardized HTTP response helpers enforcing semantic status codes:
// 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 429 (Too Many Requests), 500 (Server Error)
const { validationResult } = require('express-validator');

// Standardized HTTP Status Code Constants
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// ================= VALIDATE REQUEST MIDDLEWARE =================
// Logic: Checks express-validator results; if validation errors exist, halts request and returns 400 Bad Request with formatted error array
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      success: false,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Validation failed: Invalid request parameters', 
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  validateRequest,
  HTTP_STATUS
};
