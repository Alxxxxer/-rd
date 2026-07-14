const UserRepository = require('../repositories/UserRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const AppError = require('../utils/errors');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateRandomToken, hashToken } = require('../utils/crypto');
const { USER_STATUS } = require('../constants');
const logger = require('../utils/logger');

class AuthService {
  async login(email, password, clientInfo = {}) {
    const { ipAddress = '', userAgent = '' } = clientInfo;

    // 1. Find user (with password selected explicitly)
    const user = await UserRepository.findByEmail(email, true);
    if (!user) {
      // Log anonymous failed attempt
      await ActivityLogRepository.create({
        user: null,
        action: 'AUTH_LOGIN_FAILED',
        details: { email, reason: 'User not found' },
        ipAddress,
        userAgent
      });
      throw new AppError('Invalid email or password', 401);
    }

    // 2. Check if user is active
    if (user.status !== USER_STATUS.ACTIVE) {
      await ActivityLogRepository.create({
        user: user._id,
        action: 'AUTH_LOGIN_BLOCKED',
        details: { email, reason: 'Account deactivated' },
        ipAddress,
        userAgent
      });
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // 3. Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await ActivityLogRepository.create({
        user: user._id,
        action: 'AUTH_LOGIN_FAILED',
        details: { email, reason: 'Incorrect password' },
        ipAddress,
        userAgent
      });
      throw new AppError('Invalid email or password', 401);
    }

    // 4. Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Update user state (lastLogin)
    user.lastLogin = new Date();
    await user.save();

    // 6. Log successful audit trail
    await ActivityLogRepository.create({
      user: user._id,
      action: 'AUTH_LOGIN_SUCCESS',
      details: { email, role: user.role },
      ipAddress,
      userAgent
    });

    logger.info(`User logged in successfully: ${user.email} (${user.role})`);

    // Clean user object for response
    const sanitizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken
    };
  }

  async refreshUserToken(token, clientInfo = {}) {
    const { ipAddress = '', userAgent = '' } = clientInfo;

    // Verify token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Find user
    const user = await UserRepository.findById(decoded.id);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new AppError('User session is invalid or user is deactivated', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    const sanitizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };

    return {
      accessToken,
      user: sanitizedUser
    };
  }

  async forgotPassword(email, clientInfo = {}) {
    const { ipAddress = '', userAgent = '' } = clientInfo;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Intentionally return a success-like message or throw to prevent email enumeration.
      // In production grade CRM systems, we should return a standard message but for internal enterprise dashboards we can throw error or return generic success.
      // Let's log the attempt and throw a friendly 404/generic response or log the email.
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      throw new AppError('If a user with that email exists, a reset token has been processed.', 200);
    }

    // Generate random token and expiry (1 hour)
    const resetToken = generateRandomToken();
    const hashedResetToken = hashToken(resetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour validity
    await user.save();

    // Log the request
    await ActivityLogRepository.create({
      user: user._id,
      action: 'AUTH_FORGOT_PASSWORD_REQUEST',
      details: { email },
      ipAddress,
      userAgent
    });

    logger.info(`Password reset token generated for user: ${email}`);

    // In a full application, we would send an email with the link.
    // For this dashboard, we will return the raw token in development mode so testing is straightforward and hassle-free.
    return {
      message: 'Password reset link generated.',
      // Only expose the raw resetToken in responses for local development/testing convenience.
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    };
  }

  async resetPassword(token, newPassword, clientInfo = {}) {
    const { ipAddress = '', userAgent = '' } = clientInfo;

    const hashedToken = hashToken(token);
    const user = await UserRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    // Reset password, Mongoose hooks will hash it automatically on save
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    // Log the change
    await ActivityLogRepository.create({
      user: user._id,
      action: 'AUTH_RESET_PASSWORD_SUCCESS',
      details: { email: user.email },
      ipAddress,
      userAgent
    });

    logger.info(`Password reset successfully completed for user: ${user.email}`);

    return {
      message: 'Password has been updated successfully.'
    };
  }
}

module.exports = new AuthService();
