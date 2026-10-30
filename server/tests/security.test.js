
/**
 * S1-08 / S2-04: Sprint 1 and Sprint 2 security tests.
 *
 * Tests the real Express API, not a mock application.
 * Requirements: SR-01 to SR-05 (TC-SEC-01 to TC-SEC-05).
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const { Result, User } = require('../src/models');
const {
  createStudent,
  createAdmin,
  authHeader,
  createInternship,
  createTestWithQuestions,
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
  '/api/tests',
  '/api/results',
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

// TC-SEC-04: Students must not access another student's results.
describe('TC-SEC-04 - Student result data isolation', () => {
  test('student cannot access another student result', async () => {
    const owner = await createStudent();
    const otherStudent = await createStudent();
    const { test } = await createTestWithQuestions();

    const result = await Result.create({
      studentId: owner._id,
      testId: test._id,
      score: 1,
      totalMarks: 1,
      percentage: 100,
    });

    const response = await request(app)
      .get(`/api/results/${result._id}`)
      .set(authHeader(otherStudent));

    expectSafeError(response, 404, 'RESULT_NOT_FOUND');
  });
});


/*
 * S2-04: Sprint 2 security tests.
 * Covers every aptitude, results and admin aptitude route added in Sprint 2.
 * Requirements: SR-01, SR-02, SR-04, SR-05 (SO-01, SO-02).
 */

// Any well-formed ObjectId: authentication runs before the record is looked up.
const someId = '507f1f77bcf86cd799439011';

const sprint2StudentRoutes = [
  ['GET', '/api/tests'],
  ['GET', `/api/tests/${someId}`],
  ['POST', `/api/tests/${someId}/submit`],
  ['GET', '/api/results'],
  ['GET', `/api/results/${someId}`],
];

const sprint2AdminRoutes = [
  ['GET', '/api/admin/tests'],
  ['POST', '/api/admin/tests'],
  ['GET', `/api/admin/tests/${someId}`],
  ['PUT', `/api/admin/tests/${someId}`],
  ['DELETE', `/api/admin/tests/${someId}`],
  ['POST', `/api/admin/tests/${someId}/questions`],
  ['PUT', `/api/admin/questions/${someId}`],
  ['DELETE', `/api/admin/questions/${someId}`],
];

const allSprint2Routes = [...sprint2StudentRoutes, ...sprint2AdminRoutes];

/** Send a request with the given method, optionally with an Authorization header. */
function send(method, path, header) {
  const req = request(app)[method.toLowerCase()](path);
  return header ? req.set(header) : req;
}

/** Sign a token that expired ten seconds ago. */
function expiredHeader(user) {
  const token = jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: -10 }
  );
  return { Authorization: `Bearer ${token}` };
}

describe('TC-SEC-01 - Sprint 2 API authentication', () => {
  test.each(allSprint2Routes)(
    '%s %s rejects requests without a token',
    async (method, path) => {
      const response = await send(method, path);
      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test.each(allSprint2Routes)(
    '%s %s rejects expired tokens',
    async (method, path) => {
      const student = await createStudent();
      const response = await send(method, path, expiredHeader(student));
      expectSafeError(response, 401, 'UNAUTHORIZED');
    }
  );

  test('rejects a valid token whose user has been deleted', async () => {
    const student = await createStudent();
    const header = authHeader(student);
    await User.deleteOne({ _id: student._id });

    const response = await send('GET', '/api/results', header);
    expectSafeError(response, 401, 'UNAUTHORIZED');
  });

  test('rejects an unsigned token (alg: none)', async () => {
    const student = await createStudent();
    const unsigned = jwt.sign(
      { sub: String(student._id), role: 'student' },
      null,
      { algorithm: 'none' }
    );

    const response = await send('GET', '/api/tests', {
      Authorization: `Bearer ${unsigned}`,
    });
    expectSafeError(response, 401, 'UNAUTHORIZED');
  });
});

describe('TC-SEC-02 - Sprint 2 role-based authorization', () => {
  test.each(sprint2AdminRoutes)(
    '%s %s rejects student users',
    async (method, path) => {
      const student = await createStudent();
      const response = await send(method, path, authHeader(student));
      expectSafeError(response, 403, 'FORBIDDEN_ADMIN_ONLY');
    }
  );

  test.each(sprint2StudentRoutes)(
    '%s %s rejects admin users',
    async (method, path) => {
      const admin = await createAdmin();
      const response = await send(method, path, authHeader(admin));
      expectSafeError(response, 403, 'FORBIDDEN');
    }
  );

  test('a student token with a forged admin role is still treated as a student', async () => {
    const student = await createStudent();
    // Signed with the real secret but claiming admin: the role is re-read from the database.
    const forged = jwt.sign(
      { sub: String(student._id), role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: 3600 }
    );

    const response = await send('GET', '/api/admin/tests', {
      Authorization: `Bearer ${forged}`,
    });
    expectSafeError(response, 403, 'FORBIDDEN_ADMIN_ONLY');
  });
});

describe('TC-SEC-04 - Sprint 2 student data isolation', () => {
  test('results list contains only the caller\'s results', async () => {
    const owner = await createStudent();
    const other = await createStudent();
    const { test } = await createTestWithQuestions();

    await Result.create([
      { studentId: owner._id, testId: test._id, score: 1, totalMarks: 1, percentage: 100 },
      { studentId: other._id, testId: test._id, score: 0, totalMarks: 1, percentage: 0 },
    ]);

    const response = await send('GET', '/api/results', authHeader(other));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].percentage).toBe(0);
  });

  test('a submission cannot name another student in the body', async () => {
    const attacker = await createStudent();
    const victim = await createStudent();
    const { test, questions } = await createTestWithQuestions();

    const response = await send('POST', `/api/tests/${test._id}/submit`, authHeader(attacker))
      .send({
        studentId: String(victim._id),
        answers: [{ questionId: String(questions[0]._id), selectedOption: 1 }],
      });

    expectSafeError(response, 400, 'VALIDATION_ERROR');
    expect(await Result.countDocuments({ studentId: victim._id })).toBe(0);
  });

  test('a submitted result is stored under the token user only', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions();

    const response = await send('POST', `/api/tests/${test._id}/submit`, authHeader(student))
      .send({ answers: [{ questionId: String(questions[0]._id), selectedOption: 1 }] });

    expect(response.status).toBe(200);
    const saved = await Result.findById(response.body.data.resultId);
    expect(String(saved.studentId)).toBe(String(student._id));
  });
});

describe('TC-SEC-05 - Sprint 2 server-side protection', () => {
  test('students never receive correctOption when opening or submitting a test', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions();

    const opened = await send('GET', `/api/tests/${test._id}`, authHeader(student));
    expect(opened.status).toBe(200);
    expect(JSON.stringify(opened.body)).not.toContain('correctOption');

    const submitted = await send('POST', `/api/tests/${test._id}/submit`, authHeader(student))
      .send({ answers: [{ questionId: String(questions[0]._id), selectedOption: 0 }] });
    expect(submitted.status).toBe(200);
    expect(JSON.stringify(submitted.body)).not.toContain('correctOption');
  });

  test('malformed JSON returns INVALID_REQUEST without internal details', async () => {
    const student = await createStudent();

    const response = await send('POST', `/api/tests/${someId}/submit`, authHeader(student))
      .set('Content-Type', 'application/json')
      .send('{"answers": [');

    expectSafeError(response, 400, 'INVALID_REQUEST');
    expect(JSON.stringify(response.body)).not.toMatch(/SyntaxError|at JSON\.parse/);
  });

  test('a request body over 100kb is rejected', async () => {
    const admin = await createAdmin();

    const response = await send('POST', '/api/admin/tests', authHeader(admin))
      .send({ title: 'x'.repeat(110 * 1024), category: 'Quantitative', durationMinutes: 10 });

    expectSafeError(response, 400, 'INVALID_REQUEST');
  });

  test('admin bodies with unknown fields are rejected', async () => {
    const admin = await createAdmin();
    const { test } = await createTestWithQuestions();

    const response = await send('POST', `/api/admin/tests/${test._id}/questions`, authHeader(admin))
      .send({
        text: 'What is 3 plus 3?',
        options: ['5', '6'],
        correctOption: 1,
        category: 'Quantitative',
        testId: someId,
      });

    expectSafeError(response, 400, 'VALIDATION_ERROR');
  });
});

describe('TC-SEC-05 - Login and registration rate limiting', () => {
  test.each(['/api/login', '/api/register'])(
    '%s returns 429 TOO_MANY_REQUESTS after 20 requests from one IP',
    async (path) => {
      // The limiter is skipped when NODE_ENV=test, so load a fresh copy of the
      // app that sees a development config. Empty bodies fail validation, so
      // no database work is done.
      let limitedApp;
      jest.isolateModules(() => {
        const realConfig = jest.requireActual('../src/config/env');
        jest.doMock('../src/config/env', () => ({ ...realConfig, NODE_ENV: 'development' }));
        limitedApp = require('../src/app');
      });

      for (let i = 0; i < 20; i += 1) {
        const allowed = await request(limitedApp).post(path).send({});
        expect(allowed.status).toBe(400);
      }

      const blocked = await request(limitedApp).post(path).send({});
      expectSafeError(blocked, 429, 'TOO_MANY_REQUESTS');
    }
  );
});
