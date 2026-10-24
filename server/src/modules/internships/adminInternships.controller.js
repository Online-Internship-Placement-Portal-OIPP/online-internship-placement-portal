/**
 * S1-07: Admin Internship Management Controller.
 *
 * Handles HTTP requests for creating, updating,
 * and deleting internship listings.
 */

const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const adminInternshipsService = require('./adminInternships.service');

/**
 * POST /api/admin/internships
 * Create a new internship listing.
 */
const createInternshipHandler = asyncHandler(async (req, res) => {
  const internship = await adminInternshipsService.createInternship(
    req.body,
    req.user.id
  );

  return ok(res, internship, 201);
});

/**
 * PUT /api/admin/internships/:id
 * Update an existing internship listing.
 */
const updateInternshipHandler = asyncHandler(async (req, res) => {
  const internship = await adminInternshipsService.updateInternship(
    req.params.id,
    req.body,
    req.user.id
  );

  return ok(res, internship);
});

/**
 * DELETE /api/admin/internships/:id
 * Delete an existing internship listing.
 */
const deleteInternshipHandler = asyncHandler(async (req, res) => {
  await adminInternshipsService.deleteInternship(
    req.params.id,
    req.user.id
  );

  return ok(res, {
    deleted: true,
    id: req.params.id,
  });
});

module.exports = {
  createInternshipHandler,
  updateInternshipHandler,
  deleteInternshipHandler,
};