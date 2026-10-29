
/**
 * S2-03: Admin Aptitude Test and Question Management Routes.
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const {
  adminTestParamsSchema,
  adminQuestionParamsSchema,
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
} = require('./adminAptitude.schemas');

const {
  listTestsHandler,
  getTestHandler,
  createTestHandler,
  updateTestHandler,
  deleteTestHandler,
  createQuestionHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
} = require('./adminAptitude.controller');

const router = Router();

// All endpoints require administrator access.
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/tests
router.get('/tests', listTestsHandler);

// GET /api/admin/tests/:id
router.get(
  '/tests/:id',
  validate({ params: adminTestParamsSchema }),
  getTestHandler
);

// POST /api/admin/tests
router.post(
  '/tests',
  validate({ body: createTestSchema }),
  createTestHandler
);

// PUT /api/admin/tests/:id
router.put(
  '/tests/:id',
  validate({
    params: adminTestParamsSchema,
    body: updateTestSchema,
  }),
  updateTestHandler
);

// DELETE /api/admin/tests/:id
router.delete(
  '/tests/:id',
  validate({ params: adminTestParamsSchema }),
  deleteTestHandler
);

// POST /api/admin/tests/:id/questions
router.post(
  '/tests/:id/questions',
  validate({
    params: adminTestParamsSchema,
    body: createQuestionSchema,
  }),
  createQuestionHandler
);

// PUT /api/admin/questions/:qid
router.put(
  '/questions/:qid',
  validate({
    params: adminQuestionParamsSchema,
    body: updateQuestionSchema,
  }),
  updateQuestionHandler
);

// DELETE /api/admin/questions/:qid
router.delete(
  '/questions/:qid',
  validate({ params: adminQuestionParamsSchema }),
  deleteQuestionHandler
);

module.exports = router;
