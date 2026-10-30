const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const analysisService = require('./analysis.service');

const getAnalysisHandler = asyncHandler(async (req, res) => ok(res, await analysisService.getAnalysis(req.user.id)));

module.exports = { getAnalysisHandler };
