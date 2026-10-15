
/**
 * S0-04: Security middleware tests.
 *
 * TC-SEC-01: Authentication middleware.
 * TC-SEC-02: Authorization middleware.
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');

const {
  authenticate,
  authorize,
  signToken,
} = require('../src/middleware/auth');

const errorHandler = require('../src/middleware/errorHandler');

const {
  createStudent,
  createAdmin,
  authHeader,
} = require('./helpers');

// Create a small Express app specifically for these tests.
const app = express();

app.use(express.json());

// Any authenticated user can access this route.
app.get('/protected', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// Only administrators can access this route.
app.get(
  '/admin-only',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Admin access granted',
      },
    });
  }
);

// Only students can access this route.
app.get(
  '/student-only',
  authenticate,
  authorize('student'),
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Student access granted',
      },
    });
  }
);

// Reuse the project's actual error handler.
app.use(errorHandler);

// Check the standard error response format.
function expectErrorResponse(response, status, code) {
  expect(response.status).toBe(status);

  expect(response.body).toEqual({
    success: false,
    error: {
      code,
      message: expect.any(String),
    },
  });

  // Internal error details must never reach the client.
  expect(response.body).not.toHaveProperty('stack');
  expect(response.body.error).not.toHaveProperty('stack');
  expect(JSON.stringify(response.body)).not.toMatch(/"stack"\s*:/);
}

// --------------------------------------------------
// TC-SEC-01: Authentication
// --------------------------------------------------

describe('TC-SEC-01 authentication middleware', () => {

  test('rejects a request without a token', async () => {
    const response = await request(app)
      .get('/protected');

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('rejects a malformed Authorization header', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Basic invalid');

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer garbage');

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('rejects a token signed with the wrong secret', async () => {
    const student = await createStudent();

    const token = jwt.sign(
      {
        sub: String(student._id),
        role: 'student',
      },
      'incorrect-secret',
      { expiresIn: 3600 }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('rejects an expired token', async () => {
    const student = await createStudent();

    const token = jwt.sign(
      {
        sub: String(student._id),
        role: 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('rejects a token belonging to a deleted user', async () => {
    const student = await createStudent();

    const headers = authHeader(student);

    await User.findByIdAndDelete(student._id);

    const response = await request(app)
      .get('/protected')
      .set(headers);

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

  test('accepts a valid token and loads the user', async () => {
    const student = await createStudent();

    const token = signToken(student);

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.user).toEqual({
      id: String(student._id),
      role: 'student',
      name: student.name,
    });
  });

  test('uses the current database role instead of the token role', async () => {
    const student = await createStudent();

    const headers = authHeader(student);

    // Change the user's role after the token was created.
    await User.findByIdAndUpdate(student._id, {
      role: 'admin',
    });

    const response = await request(app)
      .get('/admin-only')
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

});

// --------------------------------------------------
// TC-SEC-02: Authorization
// --------------------------------------------------

describe('TC-SEC-02 authorization middleware', () => {

  test('blocks a student from an admin-only route', async () => {
    const student = await createStudent();

    const response = await request(app)
      .get('/admin-only')
      .set(authHeader(student));

    expectErrorResponse(
      response,
      403,
      'FORBIDDEN_ADMIN_ONLY'
    );
  });

  test('blocks an admin from a student-only route', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .get('/student-only')
      .set(authHeader(admin));

    expectErrorResponse(response, 403, 'FORBIDDEN');
  });

  test('allows an admin to access an admin-only route', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .get('/admin-only')
      .set(authHeader(admin));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message)
      .toBe('Admin access granted');
  });

  test('rejects unauthenticated access to an admin route', async () => {
    const response = await request(app)
      .get('/admin-only');

    expectErrorResponse(response, 401, 'UNAUTHORIZED');
  });

});

/**
 * S0-04 Review Fix F-02:
 * Tests for security headers, CORS and request logging.
 *
 * These tests use the REAL Express application.
 */

const realApp = require('../src/app');
const config = require('../src/config/env');

describe('S0-04 security headers and request logging', () => {

  test('normal requests receive security headers and a request ID', async () => {
    const response = await request(realApp)
      .get('/api/health')
      .set('Origin', config.CLIENT_ORIGIN);

    expect(response.status).toBe(200);

    // Helmet security header
    expect(response.headers['x-content-type-options'])
      .toBe('nosniff');

    // Unique request ID from requestLogger
    expect(response.headers['x-request-id'])
      .toMatch(/^[0-9a-f-]{36}$/i);

    // CORS header
    expect(response.headers['access-control-allow-origin'])
      .toBe(config.CLIENT_ORIGIN);
  });

  test('malformed JSON still receives security headers', async () => {
    const response = await request(realApp)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .set('Origin', config.CLIENT_ORIGIN)
      .send('{invalid json');

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_REQUEST');

    expect(response.headers['x-request-id'])
      .toBeDefined();

    expect(response.headers['x-content-type-options'])
      .toBe('nosniff');

    expect(response.headers['access-control-allow-origin'])
      .toBe(config.CLIENT_ORIGIN);
  });

  test('oversized JSON still receives security headers', async () => {
    const largeBody = {
      data: 'x'.repeat(110000),
    };

    const response = await request(realApp)
      .post('/api/health')
      .set('Origin', config.CLIENT_ORIGIN)
      .send(largeBody);

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe('INVALID_REQUEST');

    expect(response.headers['x-request-id'])
      .toBeDefined();

    expect(response.headers['x-content-type-options'])
      .toBe('nosniff');

    expect(response.headers['access-control-allow-origin'])
      .toBe(config.CLIENT_ORIGIN);
  });

  test('CORS does not allow an unapproved origin', async () => {
    const response = await request(realApp)
      .get('/api/health')
      .set('Origin', 'https://unapproved.example');

    expect(response.status).toBe(200);

    expect(response.headers['access-control-allow-origin'])
      .not.toBe('https://unapproved.example');

    expect(response.headers['access-control-allow-origin'])
      .toBe(config.CLIENT_ORIGIN);
  });

});
