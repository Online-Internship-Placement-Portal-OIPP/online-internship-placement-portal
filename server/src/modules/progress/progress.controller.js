const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const progressService = require('./progress.service');

/**
 * GET /api/progress — FR-13, SR-04
 * Returns the authenticated student's progress summary.
 */
const getProgressHandler = asyncHandler(async (req, res) => {
  const data = await progressService.getProgress(req.user.id);
  return ok(res, data);
});

module.exports = { getProgressHandler };
