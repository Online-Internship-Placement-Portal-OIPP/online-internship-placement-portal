
/**
 * S0-04: Security middleware.
 *
 * Helmet: Adds security-related HTTP headers.
 * CORS: Restricts allowed browser origins.
 * Rate limiter: Limits repeated authentication requests.
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Apply common security middleware to the Express app.
 */
function applySecurity(app) {
  app.use(helmet());

  app.use(
    cors({
      origin: config.CLIENT_ORIGIN,
      credentials: false,
    })
  );
}

/**
 * Limit login and registration requests.
 *
 * Maximum: 20 requests per 15 minutes per IP.
 *
 * This will be attached to /api/login and /api/register
 * when those routes are implemented in Sprint 1.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: 'draft-7',
  legacyHeaders: false,

  // Disable rate limiting while running automated tests.
  skip: () => config.NODE_ENV === 'test',

  handler: (req, res) => {
    const error = new AppError('TOO_MANY_REQUESTS');

    return res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  },
});

module.exports = {
  applySecurity,
  authLimiter,
};
