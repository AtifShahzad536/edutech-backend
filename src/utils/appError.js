/**
 * Custom Error class for operational errors.
 * Operational errors are predictable errors that we can handle (e.g., 404, 401, validation failures).
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
