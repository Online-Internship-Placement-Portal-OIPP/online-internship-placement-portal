/**
 * Auth routes (M1) — mounts /register and /login on the API router.
 *
 * Both endpoints are public (no authenticate middleware).
 * authLimiter allows 20 requests / 15 min / IP on each route (CLAUDE.md §8);
 * it is skipped when NODE_ENV=test.
 */
const { Router } = require('express');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/security');
const { registerSchema, loginSchema } = require('./auth.schemas');
const { registerHandler, loginHandler } = require('./auth.controller');

const router = Router();

// POST /api/register — FR-01, SR-03
router.post('/register', authLimiter, validate({ body: registerSchema }), registerHandler);

// POST /api/login — FR-02
router.post('/login', authLimiter, validate({ body: loginSchema }), loginHandler);

module.exports = router;
