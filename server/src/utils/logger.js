/**
 * Structured JSON logger.
 * Writes one JSON line per log entry with a timestamp.
 * Provides a `redact` helper that strips sensitive keys.
 */

/** Keys that must never appear in logs. */
const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'correctOption', 'authorization', 'Authorization', 'jwt'];

/**
 * Recursively remove sensitive keys from an object (returns a shallow copy).
 * @param {*} obj
 * @returns {*}
 */
function redact(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key)) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = typeof value === 'object' ? redact(value) : value;
    }
  }
  return cleaned;
}

/**
 * Write a structured JSON log line.
 * @param {'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [meta]
 */
function log(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

module.exports = {
  info:  (message, meta) => log('info',  message, meta),
  warn:  (message, meta) => log('warn',  message, meta),
  error: (message, meta) => log('error', message, meta),
  redact,
};

