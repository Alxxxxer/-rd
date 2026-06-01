/**
 * Custom Operational Error Class for Centalized Error Handling
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Demarcates expected operational errors from system bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
