/**
 * Auth routes (M1) — mounts /register and /login on the API router.
 *
 * Both endpoints are public (no authenticate middleware).
 * Rate limiting is applied globally in security.js (20 req / 15 min / IP
 * on /api/login and /api/register — SR-05, NFR-03).
 */
const { Router } = require('express');
const validate = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('./auth.schemas');
const { registerHandler, loginHandler } = require('./auth.controller');

const router = Router();

// POST /api/register — FR-01, SR-03
router.post('/register', validate({ body: registerSchema }), registerHandler);

// POST /api/login — FR-02
router.post('/login', validate({ body: loginSchema }), loginHandler);

module.exports = router;
