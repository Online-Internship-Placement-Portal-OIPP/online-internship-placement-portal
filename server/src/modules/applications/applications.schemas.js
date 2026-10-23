const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const submitApplicationSchema = z
  .object({
    internshipId: objectIdSchema,
  })
  .strict();

module.exports = { submitApplicationSchema };
