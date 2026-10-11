/**
 * Custom application error.
 * Looks up HTTP status and message from the error catalogue.
 */
const ERROR_CATALOGUE = require('./errors');

class AppError extends Error {
  /**
   * @param {string} code  - Key from the error catalogue (e.g. 'EMAIL_EXISTS').
   * @param {string} [customMessage] - Optional override for the default message.
   */
  constructor(code, customMessage) {
    const entry = ERROR_CATALOGUE[code];
    if (!entry) {
      throw new Error(`AppError: unknown error code "${code}"`);
    }
    super(customMessage || entry.message);
    this.name = 'AppError';
    this.code = code;
    this.status = entry.status;
    this.isOperational = true;
  }
}

module.exports = AppError;
