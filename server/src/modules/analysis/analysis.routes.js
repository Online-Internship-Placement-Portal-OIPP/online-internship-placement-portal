const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const { getAnalysisHandler } = require('./analysis.controller');

const router = Router();
router.get('/', authenticate, authorize('student'), getAnalysisHandler);

module.exports = router;
