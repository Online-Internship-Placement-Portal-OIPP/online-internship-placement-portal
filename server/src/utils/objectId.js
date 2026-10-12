/**
 * Zod schema and helper for validating MongoDB ObjectIds.
 */
const { z } = require('zod');
const mongoose = require('mongoose');

/** Zod schema that validates a 24-character hex string as a valid ObjectId. */
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/**
 * Check whether a value is a valid MongoDB ObjectId.
 * @param {string} val
 * @returns {boolean}
 */
function isValidObjectId(val) {
  if (typeof val === 'string') {
    return /^[0-9a-fA-F]{24}$/.test(val);
  }
  return mongoose.Types.ObjectId.isValid(val);
}

module.exports = { objectIdSchema, isValidObjectId };

