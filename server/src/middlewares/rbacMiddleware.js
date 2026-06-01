const AppError = require('../utils/errors');
const { ROLES } = require('../constants');

/**
 * Middleware to restrict access to specific roles.
 * Super Admin bypasses all checks automatically.
 * @param {...string} allowedRoles - List of roles permitted to access the resource
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication context missing in RBAC middleware', 500));
    }

    // Super Admin has all-clear clearance across the entire application
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: You do not have permissions to perform this action', 403));
    }

    next();
  };
};

module.exports = {
  restrictTo
};
