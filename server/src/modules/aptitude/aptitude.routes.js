const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { aptitudeParamsSchema, submitBodySchema } = require('./aptitude.schemas');
const {
  listTestsHandler,
  getTestForAttemptHandler,
  submitTestHandler,
} = require('./aptitude.controller');

const router = Router();

// GET /api/tests — FR-08
router.get('/', authenticate, authorize('student'), listTestsHandler);

// GET /api/tests/:id — FR-09
router.get(
  '/:id',
  authenticate,
  authorize('student'),
  validate({ params: aptitudeParamsSchema }),
  getTestForAttemptHandler
);

// POST /api/tests/:id/submit — FR-09, FR-10, FR-12
router.post(
  '/:id/submit',
  authenticate,
  authorize('student'),
  validate({ params: aptitudeParamsSchema, body: submitBodySchema }),
  submitTestHandler
);

module.exports = router;
