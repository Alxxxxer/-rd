const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/errors');
const UserRepository = require('../repositories/UserRepository');
const { USER_STATUS } = require('../constants');

const protect = async (req, res, next) => {
  try {
    let token;

    // Extract Bearer Access Token from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication failed: No access token provided', 401));
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new AppError('Authentication failed: Access token is invalid or expired', 401));
    }

    // Check if user still exists and is active
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return next(new AppError('User account has been deactivated', 403));
    }

    // Attach user information to request context
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect
};
