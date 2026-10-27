const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const aptitudeService = require('./aptitude.service');

const listTestsHandler = asyncHandler(async (req, res) => {
  const tests = await aptitudeService.listTests(req.user.id);
  return ok(res, tests);
});

const getTestForAttemptHandler = asyncHandler(async (req, res) => {
  const test = await aptitudeService.getTestForAttempt(req.params.id);
  return ok(res, test);
});

module.exports = {
  listTestsHandler,
  getTestForAttemptHandler,
};
