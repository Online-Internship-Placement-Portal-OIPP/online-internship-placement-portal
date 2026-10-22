/**
 * Internships Controller (M2).
 * Thin HTTP layer over internships.service.js.
 */
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const internshipsService = require('./internships.service');

/**
 * GET /api/internships
 * FR-03, FR-04: List internships with search, filter, pagination.
 */
const listInternshipsHandler = asyncHandler(async (req, res) => {
  const data = await internshipsService.listInternships(req.query, req.user.role);
  return ok(res, data);
});

/**
 * GET /api/internships/meta
 * FR-04: Get distinct categories and locations for filters.
 */
const getMetaHandler = asyncHandler(async (req, res) => {
  const data = await internshipsService.getMeta(req.user.role);
  return ok(res, data);
});

/**
 * GET /api/internships/:id
 * FR-05: View internship details.
 */
const getInternshipHandler = asyncHandler(async (req, res) => {
  const data = await internshipsService.getInternship(req.params.id, req.user);
  return ok(res, data);
});

module.exports = {
  listInternshipsHandler,
  getMetaHandler,
  getInternshipHandler,
};
