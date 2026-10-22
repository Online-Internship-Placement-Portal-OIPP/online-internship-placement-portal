/**
 * Internships routes (M2).
 *
 * GET /api/internships/meta - distinct categories and locations (before /:id)
 * GET /api/internships - list with search, filter, pagination
 * GET /api/internships/:id - view details (FR-05)
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  listInternshipsQuerySchema,
  internshipParamsSchema,
} = require('./internships.schemas');
const {
  listInternshipsHandler,
  getMetaHandler,
  getInternshipHandler,
} = require('./internships.controller');

const router = Router();

// GET /api/internships/meta — Must be defined BEFORE any /:id route
router.get('/meta', authenticate, getMetaHandler);

// GET /api/internships — FR-03, FR-04
router.get(
  '/',
  authenticate,
  validate({ query: listInternshipsQuerySchema }),
  listInternshipsHandler
);

// GET /api/internships/:id — FR-05
router.get(
  '/:id',
  authenticate,
  validate({ params: internshipParamsSchema }),
  getInternshipHandler
);

module.exports = router;
