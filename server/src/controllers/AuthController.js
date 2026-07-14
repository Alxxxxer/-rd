const AuthService = require('../services/AuthService');
const env = require('../config/env');

// Options for secure cookie storage
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matching JWT refresh token validity)
};

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const clientInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await AuthService.login(email, password, clientInfo);

      // Set refresh token in secure, httpOnly cookie (Option A)
      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      // Send response with user profile and access token
      res.status(200).json({
        success: true,
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      // Get refresh token from either cookie or authorization headers/body as fallback
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      const clientInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await AuthService.refreshUserToken(token, clientInfo);

      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user // Include user so frontend can restore session in one round-trip
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const clientInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await AuthService.forgotPassword(email, clientInfo);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const clientInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await AuthService.resetPassword(token, password, clientInfo);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
