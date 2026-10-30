
const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

// Validate test IDs.
const adminTestParamsSchema = z.object({
  id: objectIdSchema,
}).strict();

// Validate question IDs.
const adminQuestionParamsSchema = z.object({
  qid: objectIdSchema,
}).strict();

// Fields required when creating an aptitude test.
const createTestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1),
  description: z.string().trim().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(180),
}).strict();

// Updating a test allows partial changes.
const updateTestSchema = createTestSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update.' }
);

// Fields required when creating a question.
const createQuestionSchema = z.object({
  text: z.string().trim().min(5).max(1000),
  options: z.array(z.string().trim().min(1)).min(2).max(6),
  correctOption: z.number().int().min(0),
  category: z.string().trim().min(1),
  marks: z.number().int().min(1).max(10).optional(),
}).strict().refine(
  (data) => data.correctOption < data.options.length,
  {
    message: 'correctOption must be a valid index within options.',
    path: ['correctOption'],
  }
);

// Updating a question allows partial changes.
// The service must also validate correctOption against
// the final options after merging existing and updated data.
const updateQuestionSchema = z.object({
  text: z.string().trim().min(5).max(1000).optional(),
  options: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
  correctOption: z.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  marks: z.number().int().min(1).max(10).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update.' }
);

module.exports = {
  adminTestParamsSchema,
  adminQuestionParamsSchema,
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
};
