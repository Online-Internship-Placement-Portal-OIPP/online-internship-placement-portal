/**
 * Zod validation schemas for Internship module (M2).
 * FR-03, FR-04: Listing, searching, and filtering internships.
 */
const { z } = require('zod');

const listInternshipsQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100, 'Search query must be at most 100 characters.')
      .optional(),
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    page: z.coerce.number().int('Page must be an integer.').min(1, 'Page must be at least 1.').default(1),
    limit: z.coerce
      .number()
      .int('Limit must be an integer.')
      .min(1, 'Limit must be at least 1.')
      .max(50, 'Limit must be at most 50.')
      .default(10),
  })
  .strict();

module.exports = {
  listInternshipsQuerySchema,
  listQuerySchema: listInternshipsQuerySchema,
};
