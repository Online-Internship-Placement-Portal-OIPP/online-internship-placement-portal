const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const applicationsService = require('./applications.service');

const submitApplicationHandler = asyncHandler(async (req, res) => {
  const data = await applicationsService.submitApplication(req.user.id, req.body.internshipId);
  return ok(res, data, 201);
});

const listApplicationsHandler = asyncHandler(async (req, res) => {
  const data = await applicationsService.listApplications(req.user.id);
  return ok(res, data);
});

module.exports = { submitApplicationHandler, listApplicationsHandler };
