const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const AppError = require('../../utils/AppError');
const { submitApplicationSchema } = require('./applications.schemas');
const {
  submitApplicationHandler,
  listApplicationsHandler,
} = require('./applications.controller');

// Application IDs have a module-specific error contract for malformed input.
function validateSubmitApplication(req, res, next) {
  const result = submitApplicationSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('INVALID_APPLICATION'));
  }
  req.body = result.data;
  return next();
}

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('student'),
  validateSubmitApplication,
  submitApplicationHandler
);

router.get('/', authenticate, authorize('student'), listApplicationsHandler);

module.exports = router;
