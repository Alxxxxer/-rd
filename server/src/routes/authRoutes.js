const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validate, schemas } = require('../middlewares/validationMiddleware');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define login endpoint
router.post(
  '/login', 
  validate(schemas.login), 
  AuthController.login
);

// Define token refresh endpoint
router.post(
  '/refresh', 
  AuthController.refresh
);

// Define forgot password request endpoint
router.post(
  '/forgot-password', 
  validate(schemas.forgotPassword), 
  AuthController.forgotPassword
);

// Define reset password completion endpoint
router.post(
  '/reset-password', 
  validate(schemas.resetPassword), 
  AuthController.resetPassword
);

// Define get profile endpoint
router.get(
  '/me',
  protect,
  AuthController.getMe
);

// Define logout endpoint
router.post(
  '/logout', 
  AuthController.logout
);

module.exports = router;
