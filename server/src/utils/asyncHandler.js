/**
 * Wraps an async Express route handler so thrown errors are forwarded to next().
 * @param {Function} fn - Async (req, res, next) function.
 * @returns {Function} Express middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
