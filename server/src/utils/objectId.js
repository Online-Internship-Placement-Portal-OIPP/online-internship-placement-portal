/**
 * Zod schema and helper for validating MongoDB ObjectIds.
 */
const { z } = require('zod');
const mongoose = require('mongoose');

/** Zod schema that validates a 24-character hex string as a valid ObjectId. */
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format',
  });

/**
 * Check whether a value is a valid MongoDB ObjectId.
 * @param {string} val
 * @returns {boolean}
 */
function isValidObjectId(val) {
  return mongoose.Types.ObjectId.isValid(val);
}

module.exports = { objectIdSchema, isValidObjectId };

