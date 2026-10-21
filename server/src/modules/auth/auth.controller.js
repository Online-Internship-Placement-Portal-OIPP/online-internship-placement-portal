/**
 * Auth controller (M1) — thin HTTP layer over auth.service.js.
 *
 * Controllers:
 *  - receive validated request data (already passed through validate middleware)
 *  - call service functions
 *  - send standard success envelopes via ok()
 *  - never touch models directly (SAD §4.1)
 */
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const authService = require('./auth.service');

/**
 * POST /api/register
 * FR-01 — Create a student account.
 */
const registerHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const data = await authService.register({ name, email, password });
  return ok(res, data, 201);
});

/**
 * POST /api/login
 * FR-02 — Authenticate user and issue JWT.
 */
const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password });
  return ok(res, data);
});

module.exports = { registerHandler, loginHandler };
