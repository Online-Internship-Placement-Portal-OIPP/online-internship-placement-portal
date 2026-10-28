const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { aptitudeParamsSchema } = require('./aptitude.schemas');
const {
  listTestsHandler,
  getTestForAttemptHandler,
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

module.exports = router;
