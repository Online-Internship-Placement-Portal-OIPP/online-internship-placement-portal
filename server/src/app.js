
/**
 * Express application setup.
 * Builds the app with middleware, routes and error handling.
 * Exported for use by server.js and tests (no listen call here).
 */
const express = require('express');
const { isDbUp } = require('./config/db');
const { ok } = require('./utils/respond');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// S0-04: Security middleware
const requestLogger = require('./middleware/requestLogger');
const { applySecurity } = require('./middleware/security');

const app = express();


 // SECURITY MIDDLEWARE (S0-04)
app.use(requestLogger);
applySecurity(app);

// --- Body parser ---
app.use(express.json({ limit: '100kb' }));


// --- Health check ---
app.get('/api/health', (req, res) => {
  ok(res, { status: 'ok', db: isDbUp() ? 'up' : 'down' });
});

// --- Feature routes ---
const apiRouter = express.Router();

// M1 — Authentication (FR-01, FR-02)
const authRoutes = require('./modules/auth/auth.routes');
apiRouter.use('/', authRoutes);

// M2 — Internship Management (FR-03, FR-04)
apiRouter.use('/internships', require('./modules/internships/internships.routes'));

// M3 — Application Management (FR-06, FR-07, FR-12, NFR-04)
apiRouter.use('/applications', require('./modules/applications/applications.routes'));

app.use('/api', apiRouter);

// --- 404 catch-all ---
app.use(notFound);

// --- Central error handler ---
app.use(errorHandler);

module.exports = app;
