const rateLimit = require('express-rate-limit');
const AppError = require('../utils/errors');

/**
 * Rate Limiter for Authentication & Sensitive API endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 20 in prod, 100 in dev
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new AppError('Too many login attempts. Please try again after 15 minutes.', 429));
  }
});

module.exports = {
  authLimiter
};
