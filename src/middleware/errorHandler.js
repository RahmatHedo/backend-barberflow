// ===========================================
// Global Error Handler Middleware
// ===========================================

/**
 * Custom application error class.
 * Allows controllers to throw errors with specific status codes.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware.
 * Catches all errors thrown or passed via next(err).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code;

  // Fallback Joi validation error (jika lolos ke sini)
  if (err.isJoi) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.details.map((detail) => detail.message).join('; ');
  }

  // Log the error — only log 5xx as red errors, 4xx are expected client errors
  if (process.env.NODE_ENV !== 'production') {
    if (statusCode >= 500) {
      console.error('🔴 Server Error:', {
        message: err.message,
        statusCode,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
      });
    } else if (statusCode >= 400) {
      // 4xx = expected client errors, log minimally
      console.log(`🔵 Client Error [${statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`);
    }
  } else {
    if (statusCode >= 500) {
      console.error(`🔴 Error [${req.method} ${req.originalUrl}]: ${err.message}`);
    }
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  // JWT specific errors (fallback, usually caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  // Refresh token expired (dilempar dari authController.refreshToken)
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'REFRESH_TOKEN_EXPIRED';
    message = 'Refresh token expired. Please login again.';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
