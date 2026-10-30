
/**
 * S2-03: Admin Aptitude Test and Question Management Controller.
 */

const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const adminAptitudeService = require('./adminAptitude.service');

// GET /api/admin/tests
const listTestsHandler = asyncHandler(async (req, res) => {
  const tests = await adminAptitudeService.listTests();
  return ok(res, tests);
});

// GET /api/admin/tests/:id
const getTestHandler = asyncHandler(async (req, res) => {
  const test = await adminAptitudeService.getTest(req.params.id);
  return ok(res, test);
});

// POST /api/admin/tests
const createTestHandler = asyncHandler(async (req, res) => {
  const test = await adminAptitudeService.createTest(
    req.body,
    req.user.id
  );
  return ok(res, test, 201);
});

// PUT /api/admin/tests/:id
const updateTestHandler = asyncHandler(async (req, res) => {
  const test = await adminAptitudeService.updateTest(
    req.params.id,
    req.body,
    req.user.id
  );
  return ok(res, test);
});

// DELETE /api/admin/tests/:id
const deleteTestHandler = asyncHandler(async (req, res) => {
  const result = await adminAptitudeService.deleteTest(
    req.params.id,
    req.user.id
  );
  return ok(res, result);
});

// POST /api/admin/tests/:id/questions
const createQuestionHandler = asyncHandler(async (req, res) => {
  const question = await adminAptitudeService.createQuestion(
    req.params.id,
    req.body,
    req.user.id
  );
  return ok(res, question, 201);
});

// PUT /api/admin/questions/:qid
const updateQuestionHandler = asyncHandler(async (req, res) => {
  const question = await adminAptitudeService.updateQuestion(
    req.params.qid,
    req.body,
    req.user.id
  );
  return ok(res, question);
});

// DELETE /api/admin/questions/:qid
const deleteQuestionHandler = asyncHandler(async (req, res) => {
  const result = await adminAptitudeService.deleteQuestion(
    req.params.qid,
    req.user.id
  );
  return ok(res, result);
});

module.exports = {
  listTestsHandler,
  getTestHandler,
  createTestHandler,
  updateTestHandler,
  deleteTestHandler,
  createQuestionHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
};
