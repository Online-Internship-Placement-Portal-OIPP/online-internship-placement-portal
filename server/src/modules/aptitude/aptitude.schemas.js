const z = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const aptitudeParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

/**
 * Validates the body of POST /api/tests/:id/submit (FR-09, FR-10).
 * Each answer has a questionId (valid ObjectId) and selectedOption (int >= 0).
 * Array is capped at 200 to prevent abuse.
 */
const submitBodySchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionId: objectIdSchema,
            selectedOption: z.number().int().min(0),
          })
          .strict()
      )
      .max(200),
  })
  .strict();

/**
 * Validates :id param on result endpoints.
 * Invalid ObjectId → 400 INVALID_REQUEST via validate middleware.
 */
const resultParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

module.exports = {
  aptitudeParamsSchema,
  testParamsSchema: aptitudeParamsSchema,
  submitBodySchema,
  resultParamsSchema,
};
