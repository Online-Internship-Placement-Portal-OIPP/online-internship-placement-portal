/**
 * Zod validation schemas for the Auth module (M1).
 * FR-01: Student registration — name, email, password constraints.
 * FR-02: Login — email + password.
 *
 * All body schemas use .strict() to reject unknown fields (CLAUDE.md §2).
 */
const { z } = require('zod');

/** POST /api/register */
const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required.' })
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(80, 'Name must be at most 80 characters.'),
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .toLowerCase()
      .email('A valid email address is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must be at most 72 characters.'),
  })
  .strict();

/** POST /api/login */
const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .toLowerCase()
      .email('A valid email address is required.'),
    password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
  })
  .strict();

module.exports = { registerSchema, loginSchema };
