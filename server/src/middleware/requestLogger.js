
/**
 * S0-04: HTTP request logger.
 *
 * Gives each request a unique ID and records
 * the method, path, status and processing time.
 *
 * Never logs passwords, tokens, headers or request bodies.
 */

const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  // Record when the request started.
  const start = process.hrtime.bigint();

  // Give this request a unique identification number.
  req.id = randomUUID();

  // Include the request ID in the response headers.
  res.setHeader('X-Request-Id', req.id);

  // Run after the response has finished.
  res.on('finish', () => {
    const elapsed = process.hrtime.bigint() - start;
    const durationMs = Number(elapsed) / 1_000_000;

    const details = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    // Include the user ID only if the user was authenticated.
    if (req.user && req.user.id) {
      details.userId = req.user.id;
    }

    // Choose the log level based on HTTP status.
    if (res.statusCode >= 500) {
      logger.error('HTTP request completed', details);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request completed', details);
    } else {
      logger.info('HTTP request completed', details);
    }
  });

  next();
}

module.exports = requestLogger;
