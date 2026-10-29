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

/**
 * POST /api/tests/:id/submit — FR-09, FR-10, FR-12
 * Scores the submission server-side and persists a Result document.
 */
const submitTestHandler = asyncHandler(async (req, res) => {
  const data = await aptitudeService.evaluateSubmission(
    req.user.id,
    req.params.id,
    req.body.answers
  );
  return ok(res, data, 200);
});

/**
 * GET /api/results — FR-11
 * Returns all results for the authenticated student, newest first.
 */
const listResultsHandler = asyncHandler(async (req, res) => {
  const results = await aptitudeService.listResults(req.user.id);
  return ok(res, results);
});

/**
 * GET /api/results/:id — FR-11, SR-04
 * Returns a single result. Returns 404 when the result belongs to another student.
 */
const getResultHandler = asyncHandler(async (req, res) => {
  const result = await aptitudeService.getResult(req.user.id, req.params.id);
  return ok(res, result);
});

module.exports = {
  listTestsHandler,
  getTestForAttemptHandler,
  submitTestHandler,
  listResultsHandler,
  getResultHandler,
};
