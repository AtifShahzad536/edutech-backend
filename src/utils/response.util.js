/**
 * Standardized success response
 * @param {Object|Array} data - The payload
 * @param {String} message - Optional message
 * @param {Object} meta - Optional metadata (like pagination)
 * @returns {Object}
 */
const successResponse = (data = null, message = 'Success', meta = undefined) => {
  const response = {
    success: true,
    message,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Standardized error response
 * @param {String} message - Error message
 * @param {Array} errors - Optional array of validation errors
 * @returns {Object}
 */
const errorResponse = (message = 'Error', errors = undefined) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

module.exports = {
  successResponse,
  errorResponse,
};
