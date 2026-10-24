
/**
 * S1-08: Sprint 1 security tests.
 *
 * Tests the real Express API, not a mock application.
 * Requirements: SR-01, SR-03, SR-05.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const {
  createStudent,
  authHeader,
  createInternship,
} = require('./helpers');

require('./setup');

// Confirm errors never expose sensitive information.
function expectSafeError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe(code);

  const body = JSON.stringify(response.body);

  expect(body).not.toContain('passwordHash');
  expect(body).not.toMatch(/"stack"\s*:/);
}

// All currently registered protected API routes.
const protectedRoutes = [
  '/api/internships',
  '/api/internships/meta',
];

describe('TC-SEC-01 - Protected API authentication', () => {
  test.each(protectedRoutes)(
    '%s rejects requests without a token',
    async (path) => {
      const response = await request(app).get(path);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test('internship details reject requests without a token', async () => {
    const internship = await createInternship();

    const response = await request(app)
      .get(`/api/internships/${internship._id}`);

    expectSafeError(response, 401, 'UNAUTHORIZED');
  });

  test.each(protectedRoutes)(
    '%s rejects tampered tokens',
    async (path) => {
      const student = await createStudent();
      const header = authHeader(student);
      const original = header.Authorization.slice(7);

      const parts = original.split('.');
      const signature = parts[2];
      parts[2] =
        (signature[0] === 'a' ? 'b' : 'a') +
        signature.slice(1);

      const response = await request(app)
        .get(path)
        .set('Authorization', `Bearer ${parts.join('.')}`);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(protectedRoutes)(
    '%s rejects expired tokens',
    async (path) => {
      const student = await createStudent();

      const expiredToken = jwt.sign(
        {
          sub: String(student._id),
          role: 'student',
        },
        process.env.JWT_SECRET,
        { expiresIn: -10 }
      );

      const response = await request(app)
        .get(path)
        .set('Authorization', `Bearer ${expiredToken}`);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test('internship details reject tampered and expired tokens', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const path = `/api/internships/${internship._id}`;

    const validToken = authHeader(student).Authorization.slice(7);
    const parts = validToken.split('.');
    const signature = parts[2];
    parts[2] =
      (signature[0] === 'a' ? 'b' : 'a') +
      signature.slice(1);

    const tamperedResponse = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${parts.join('.')}`);

    expectSafeError(tamperedResponse, 401, 'UNAUTHORIZED');

    const expiredToken = jwt.sign(
      {
        sub: String(student._id),
        role: 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const expiredResponse = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${expiredToken}`);

    expectSafeError(expiredResponse, 401, 'UNAUTHORIZED');
  });
});

describe('TC-SEC-05 - Server-side API security', () => {
  test('rejects direct API access without authentication', async () => {
    const response = await request(app)
      .get('/api/internships');

    expectSafeError(response, 401, 'UNAUTHORIZED');
  });

  test('does not expose password hashes in internship responses', async () => {
    const student = await createStudent();
    await createInternship();

    const response = await request(app)
      .get('/api/internships')
      .set(authHeader(student));

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body))
      .not.toContain('passwordHash');
  });
});

describe('TC-SEC-01 and TC-SEC-02 - Application API security', () => {
  const applicationRoutes = [
    ['GET', '/api/applications'],
    ['POST', '/api/applications'],
  ];

  test.each(applicationRoutes)(
    '%s %s rejects requests without a token',
    async (method, path) => {
      const response = await request(app)[method.toLowerCase()](path);
      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(applicationRoutes)(
    '%s %s rejects tampered tokens',
    async (method, path) => {
      const student = await createStudent();
      const token = authHeader(student).Authorization.slice(7);
      const parts = token.split('.');

      parts[2] =
        (parts[2][0] === 'a' ? 'b' : 'a') +
        parts[2].slice(1);

      const response = await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${parts.join('.')}`);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(applicationRoutes)(
    '%s %s rejects expired tokens',
    async (method, path) => {
      const student = await createStudent();

      const expiredToken = jwt.sign(
        { sub: String(student._id), role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: -10 }
      );

      const response = await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${expiredToken}`);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(applicationRoutes)(
    '%s %s rejects admin users',
    async (method, path) => {
      const { createAdmin } = require('./helpers');
      const admin = await createAdmin();

      const response = await request(app)[method.toLowerCase()](path)
        .set(authHeader(admin));

      expectSafeError(response, 403, 'FORBIDDEN');
    }
  );
});

describe('TC-SEC-02 - Admin internship API security', () => {
  const adminRoutes = [
    ['POST', '/api/admin/internships'],
    ['PUT', '/api/admin/internships/507f1f77bcf86cd799439011'],
    ['DELETE', '/api/admin/internships/507f1f77bcf86cd799439011'],
  ];

  test.each(adminRoutes)(
    '%s %s rejects unauthenticated requests',
    async (method, path) => {
      const response = await request(app)[method.toLowerCase()](path);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(adminRoutes)(
    '%s %s rejects student users',
    async (method, path) => {
      const student = await createStudent();

      const response = await request(app)[method.toLowerCase()](path)
        .set(authHeader(student));

      expectSafeError(response, 403, 'FORBIDDEN_ADMIN_ONLY');
    }
  );

  test.each(adminRoutes)(
    '%s %s rejects expired tokens',
    async (method, path) => {
      const student = await createStudent();

      const expiredToken = jwt.sign(
        { sub: String(student._id), role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: -10 }
      );

      const response = await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${expiredToken}`);

      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );
});

