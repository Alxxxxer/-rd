const env = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');

// Handler for invalid MongoDB Object IDs
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Handler for duplicate fields (MongoDB error code 11000)
const handleDuplicateFieldsDB = (err) => {
  // Extract duplicate field value from err.message (modern MongoDB driver)
  const match = (err.message || '').match(/("[^"]+"|'[^']+')/);
  const value = match ? match[0] : 'unknown';
  const message = `Duplicate value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

// Handler for Mongoose validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handler for expired JWT signature
const handleJWTExpiredError = () => {
  return new AppError('Your session has expired. Please log in again.', 401);
};

// Handler for invalid JWT signature
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, req, res) => {
  // 1. Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } 
  // 2. Unknown or system bug error: don't leak details to client
  else {
    // Log unexpected errors securely
    logger.error('Unexpected System Error:', err);

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong on the server.'
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.assign(err);
    error.message = err.message;

    // Normalizing MongoDB / Mongoose errors into operational AppErrors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    sendErrorProd(error, req, res);
  }
};

module.exports = globalErrorHandler;
