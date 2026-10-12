/**
 * Central error-handling middleware.
 *
 * Mapping rules (CLAUDE.md §7):
 *  - AppError        → its own status and code
 *  - ZodError        → 400 VALIDATION_ERROR with details [{ field, message }]
 *  - Mongoose CastError → 400 INVALID_REQUEST
 *  - JSON SyntaxError / entity.too.large → 400 INVALID_REQUEST
 *  - Everything else → 500 SERVER_ERROR (stack logged, never sent)
 */
const ERRORS = require('../utils/errors');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // --- AppError (known operational error) ---
  if (err.name === 'AppError') {
    const payload = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    return res.status(err.status).json(payload);
  }

  // --- ZodError → VALIDATION_ERROR with field details ---
  if (err.name === 'ZodError') {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    const { status, message } = ERRORS.VALIDATION_ERROR;
    return res.status(status).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message, details },
    });
  }

  // --- Mongoose CastError → INVALID_REQUEST ---
  if (err.name === 'CastError') {
    const { status, message } = ERRORS.INVALID_REQUEST;
    return res.status(status).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message },
    });
  }

  // --- JSON parse error or body too large → INVALID_REQUEST ---
  if (
    (err.type === 'entity.parse.failed' && err instanceof SyntaxError) ||
    err.type === 'entity.too.large'
  ) {
    const { status, message } = ERRORS.INVALID_REQUEST;
    return res.status(status).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message },
    });
  }

  // --- Fallback: unexpected error → SERVER_ERROR ---
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  const { status, message } = ERRORS.SERVER_ERROR;
  return res.status(status).json({
    success: false,
    error: { code: 'SERVER_ERROR', message },
  });
}

module.exports = errorHandler;
