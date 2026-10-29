/**
 * Routes for GET /api/results and GET /api/results/:id (FR-11, SR-04).
 * Mounted in app.js at /results.
 */
const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { resultParamsSchema } = require('./aptitude.schemas');
const { listResultsHandler, getResultHandler } = require('./aptitude.controller');

const router = Router();

// GET /api/results — FR-11
router.get('/', authenticate, authorize('student'), listResultsHandler);

// GET /api/results/:id — FR-11, SR-04
router.get(
  '/:id',
  authenticate,
  authorize('student'),
  validate({ params: resultParamsSchema }),
  getResultHandler
);

module.exports = router;
