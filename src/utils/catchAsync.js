/**
 * Wraps an asynchronous function to catch any errors and pass them to the global error handler.
 * This eliminates the need for repetitive try-catch blocks in controllers.
 * 
 * @param {Function} fn - The asynchronous function to wrap.
 * @returns {Function} - A function that handles req, res, and next.
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
