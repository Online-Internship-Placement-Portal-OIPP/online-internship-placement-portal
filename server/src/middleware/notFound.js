/**
 * Catch-all middleware for undefined routes.
 * Returns the standard NOT_FOUND error envelope.
 */
const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError('NOT_FOUND'));
}

module.exports = notFound;
