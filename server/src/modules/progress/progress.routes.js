/**
 * Route for GET /api/progress (FR-13, SR-04).
 * Mounted in app.js at /progress.
 */
const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const { getProgressHandler } = require('./progress.controller');

const router = Router();

// GET /api/progress — FR-13
router.get('/', authenticate, authorize('student'), getProgressHandler);

module.exports = router;
