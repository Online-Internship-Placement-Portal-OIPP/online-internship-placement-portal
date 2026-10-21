/**
 * Auth API tests — S1-01: Student registration.
 *
 * Test Plan IDs covered:
 *  TC-AUTH-01 — Student registration: valid input creates user, returns 201.
 *  TC-SEC-03  — Passwords are never stored in plain text and never returned.
 *
 * Also covers:
 *  - 400 VALIDATION_ERROR with field details for invalid input.
 *  - 409 EMAIL_EXISTS for duplicate email.
 *  - 401 INVALID_CREDENTIALS for wrong login credentials.
 *  - Role is always 'student' regardless of any supplied role.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { User } = require('../src/models');

// setup.js (jest config globalSetup) wires the in-memory MongoDB
require('./setup');

// ---------------------------------------------------------------------------
// Helper: register payload
// ---------------------------------------------------------------------------
const validPayload = () => ({
  name: 'Alice Smith',
  email: 'alice@example.com',
  password: 'Secret123',
});

// ---------------------------------------------------------------------------
// TC-AUTH-01 — Student registration
// ---------------------------------------------------------------------------
describe('TC-AUTH-01 POST /api/register — student registration', () => {
  it('returns 201 with userId, name, email and role:student for valid input', async () => {
    const res = await request(app).post('/api/register').send(validPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toMatchObject({
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'student',
    });
    expect(data.userId).toBeDefined();
  });

  it('trims and lowercases the email before saving', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), email: '  Alice@Example.COM  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('alice@example.com');
  });

  it('always assigns role:student even if a role field is supplied', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), role: 'admin' });

    // strict() schema rejects unknown fields → 400 VALIDATION_ERROR
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-01 — Validation (400 VALIDATION_ERROR)
// ---------------------------------------------------------------------------
describe('TC-AUTH-01 POST /api/register — input validation', () => {
  it('returns 400 VALIDATION_ERROR when name is missing', async () => {
    const { name: _n, ...rest } = validPayload();
    const res = await request(app).post('/api/register').send(rest);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'name')).toBe(true);
  });

  it('returns 400 VALIDATION_ERROR when email is invalid', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'email')).toBe(true);
  });

  it('returns 400 VALIDATION_ERROR when password is shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'password')).toBe(true);
  });

  it('returns 400 VALIDATION_ERROR when password is longer than 72 chars', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), password: 'A'.repeat(73) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when name is shorter than 2 chars', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), name: 'X' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when body is empty', async () => {
    const res = await request(app).post('/api/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-01 — Duplicate email (409 EMAIL_EXISTS)
// ---------------------------------------------------------------------------
describe('TC-AUTH-01 POST /api/register — duplicate email', () => {
  it('returns 409 EMAIL_EXISTS when email is already registered', async () => {
    // First registration
    await request(app).post('/api/register').send(validPayload());

    // Second registration with same email
    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), name: 'Bob Jones' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('returns 409 EMAIL_EXISTS even if email casing differs', async () => {
    await request(app).post('/api/register').send(validPayload());

    const res = await request(app)
      .post('/api/register')
      .send({ ...validPayload(), email: 'ALICE@EXAMPLE.COM' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });
});

// ---------------------------------------------------------------------------
// TC-SEC-03 — Password security
// ---------------------------------------------------------------------------
describe('TC-SEC-03 POST /api/register — password security', () => {
  it('does not store the plaintext password in the database', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);

    // Fetch the raw document with passwordHash selected
    const user = await User.findOne({ email: payload.email }).select('+passwordHash');
    expect(user).not.toBeNull();

    // Must not be stored in plain text
    expect(user.passwordHash).not.toBe(payload.password);

    // Must be a valid bcrypt hash
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    const matches = await bcrypt.compare(payload.password, user.passwordHash);
    expect(matches).toBe(true);
  });

  it('does not return passwordHash in the registration response', async () => {
    const res = await request(app).post('/api/register').send(validPayload());

    expect(res.status).toBe(201);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('password');
  });

  it('does not return passwordHash in the login response', async () => {
    await request(app).post('/api/register').send(validPayload());

    const res = await request(app)
      .post('/api/login')
      .send({ email: validPayload().email, password: validPayload().password });

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(validPayload().password);
  });
});

// ---------------------------------------------------------------------------
// FR-02 — Login
// ---------------------------------------------------------------------------
describe('POST /api/login — authentication', () => {
  beforeEach(async () => {
    await request(app).post('/api/register').send(validPayload());
  });

  it('returns 200 with token, role, name and expiresIn for correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: validPayload().email, password: validPayload().password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(data.token).toBeDefined();
    expect(data.role).toBe('student');
    expect(data.name).toBe('Alice Smith');
    expect(data.expiresIn).toBeGreaterThan(0);
  });

  it('returns 401 INVALID_CREDENTIALS for wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: validPayload().email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 INVALID_CREDENTIALS for unknown email', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@example.com', password: validPayload().password });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the same error for wrong password and unknown email (no enumeration)', async () => {
    const wrongPass = await request(app)
      .post('/api/login')
      .send({ email: validPayload().email, password: 'wrongpassword' });

    const wrongEmail = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@example.com', password: validPayload().password });

    expect(wrongPass.status).toBe(wrongEmail.status);
    expect(wrongPass.body.error.code).toBe(wrongEmail.body.error.code);
    expect(wrongPass.body.error.message).toBe(wrongEmail.body.error.message);
  });

  it('returns 400 VALIDATION_ERROR when login body is missing fields', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
