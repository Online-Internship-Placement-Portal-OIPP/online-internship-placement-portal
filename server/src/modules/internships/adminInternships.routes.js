
/**
 * S1-07: Admin Internship Management Routes.
 */

const { Router } = require('express');

const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const {
  createInternshipSchema,
  updateInternshipSchema,
  adminInternshipParamsSchema,
} = require('./adminInternships.schemas');

const {
  createInternshipHandler,
  updateInternshipHandler,
  deleteInternshipHandler,
} = require('./adminInternships.controller');

const router = Router();

// All routes require a logged-in administrator.
router.use(authenticate);
router.use(authorize('admin'));

// Create internship
router.post(
  '/',
  validate({ body: createInternshipSchema }),
  createInternshipHandler
);

// Update internship
router.put(
  '/:id',
  validate({
    params: adminInternshipParamsSchema,
    body: updateInternshipSchema,
  }),
  updateInternshipHandler
);

// Delete internship
router.delete(
  '/:id',
  validate({ params: adminInternshipParamsSchema }),
  deleteInternshipHandler
);

module.exports = router;
