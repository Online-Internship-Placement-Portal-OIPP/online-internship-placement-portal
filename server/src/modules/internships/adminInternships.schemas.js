
const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

// Fields accepted when an admin creates an internship.
const createInternshipSchema = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(120),
  location: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(10).max(5000),
  deadline: z.coerce.date(),
  status: z.enum(['open', 'closed']).default('open'),
}).strict();

// Editing allows any subset of the existing fields,
// but requires at least one field to be provided.
const updateInternshipSchema = createInternshipSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Provide at least one field to update.' }
  );

// Validate internship IDs for edit and delete requests.
const adminInternshipParamsSchema = z.object({
  id: objectIdSchema,
}).strict();

module.exports = {
  createInternshipSchema,
  updateInternshipSchema,
  adminInternshipParamsSchema,
};
