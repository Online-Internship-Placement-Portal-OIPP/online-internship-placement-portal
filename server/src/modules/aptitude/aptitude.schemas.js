const z = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const aptitudeParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

module.exports = {
  aptitudeParamsSchema,
  testParamsSchema: aptitudeParamsSchema,
};
