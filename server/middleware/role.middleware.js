// Role middleware: Role-Based Access Control (RBAC) to restrict access to specific roles (e.g., 'admin', 'doctor', 'patient').

// ================= AUTHORIZE ROLES MIDDLEWARE =================
// Logic: Higher-order middleware function checking whether req.user.role matches allowed role permissions
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // 1. Check if user's role is included in allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // 2. User has permission, proceed to route handler
    next();
  };
};

module.exports = authorizeRoles;