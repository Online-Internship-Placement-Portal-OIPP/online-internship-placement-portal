const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { User, Question, Test } = require('../src/models');
const { objectIdSchema, isValidObjectId } = require('../src/utils/objectId');
const logger = require('../src/utils/logger');

describe('Scaffold and Foundation Tests', () => {
  describe('NFR-01 / TC-HEALTH-01 · Health Check Endpoint', () => {
    it('returns { success: true, data: { status: "ok", db: "up" } } when db is connected', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: {
          status: 'ok',
          db: 'up',
        },
      });
    });
  });

  describe('TC-ERR-01 · Unknown Route Handling', () => {
    it('returns 404 with NOT_FOUND error envelope for undefined endpoints', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found.',
        },
      });
    });
  });

  describe('TC-ERR-02 · Malformed JSON Handling', () => {
    it('returns 400 with INVALID_REQUEST when request body contains invalid JSON', async () => {
      const res = await request(app)
        .post('/api/health')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request could not be understood.',
        },
      });
    });
  });

  describe('TC-DATA-01 · User Model and Unique Email Index', () => {
    it('enforces unique email index and prevents duplicates', async () => {
      await User.create({
        name: 'First User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_1',
        role: 'student',
      });

      await expect(
        User.create({
          name: 'Duplicate User',
          email: 'test@example.com',
          passwordHash: 'hashed_password_2',
          role: 'student',
        })
      ).rejects.toThrow();
    });

    it('hides passwordHash and maps _id to id in toJSON transform', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'secret_hash',
        role: 'student',
      });

      const json = user.toJSON();
      expect(json.id).toBeDefined();
      expect(json.id).toBe(user._id.toString());
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.passwordHash).toBeUndefined();
    });
  });

  describe('TC-DATA-02 · Question Model Validation and toJSON', () => {
    let dummyTestId;

    beforeEach(async () => {
      const test = await Test.create({
        title: 'Aptitude Test',
        category: 'Logical',
        durationMinutes: 30,
      });
      dummyTestId = test._id;
    });

    it('rejects whitespace-only strings in options', async () => {
      const q = new Question({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['4', '   '],
        correctOption: 0,
        category: 'Quantitative',
      });

      await expect(q.validate()).rejects.toThrow();
    });

    it('rejects options with fewer than 2 items', async () => {
      const q = new Question({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['4'],
        correctOption: 0,
        category: 'Quantitative',
      });

      await expect(q.validate()).rejects.toThrow();
    });

    it('rejects options with more than 6 items', async () => {
      const q = new Question({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['1', '2', '3', '4', '5', '6', '7'],
        correctOption: 0,
        category: 'Quantitative',
      });

      await expect(q.validate()).rejects.toThrow();
    });

    it('rejects negative correctOption index', async () => {
      const q = new Question({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['3', '4'],
        correctOption: -1,
        category: 'Quantitative',
      });

      await expect(q.validate()).rejects.toThrow();
    });

    it('rejects correctOption index equal to or greater than options length', async () => {
      const q = new Question({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['3', '4'],
        correctOption: 2,
        category: 'Quantitative',
      });

      await expect(q.validate()).rejects.toThrow();
    });

    it('accepts valid question and does not delete correctOption in toJSON when selected', async () => {
      const q = await Question.create({
        testId: dummyTestId,
        text: 'What is 2 + 2?',
        options: ['3', '4'],
        correctOption: 1,
        category: 'Quantitative',
      });

      // Default query (correctOption has select: false)
      const fetchedWithout = await Question.findById(q._id);
      expect(fetchedWithout.toJSON().correctOption).toBeUndefined();

      // Explicit select for admin (+correctOption)
      const fetchedWith = await Question.findById(q._id).select('+correctOption');
      const json = fetchedWith.toJSON();
      expect(json.correctOption).toBe(1);
      expect(json.id).toBe(q._id.toString());
      expect(json._id).toBeUndefined();
    });
  });

  describe('TC-SEC-01 · ObjectId Validation Utility', () => {
    it('accepts valid 24-hex string', () => {
      const validHex = '507f1f77bcf86cd799439011';
      expect(objectIdSchema.safeParse(validHex).success).toBe(true);
      expect(isValidObjectId(validHex)).toBe(true);
    });

    it('rejects 12-byte non-hex string like "hello world!"', () => {
      const twelveByteStr = 'hello world!';
      expect(objectIdSchema.safeParse(twelveByteStr).success).toBe(false);
      expect(isValidObjectId(twelveByteStr)).toBe(false);
    });
  });

  describe('TC-SEC-02 · Logger Redaction Utility', () => {
    it('redacts sensitive fields including password, token, correctOption, authorization, jwt', () => {
      const raw = {
        name: 'Alice',
        password: 'secret_password',
        passwordHash: 'hash123',
        token: 'token123',
        correctOption: 2,
        authorization: 'Bearer xyz',
        Authorization: 'Bearer abc',
        jwt: 'jwt.token.val',
        nested: {
          password: 'inner_password',
          safeKey: 'hello',
        },
      };

      const cleaned = logger.redact(raw);

      expect(cleaned.password).toBe('[REDACTED]');
      expect(cleaned.passwordHash).toBe('[REDACTED]');
      expect(cleaned.token).toBe('[REDACTED]');
      expect(cleaned.correctOption).toBe('[REDACTED]');
      expect(cleaned.authorization).toBe('[REDACTED]');
      expect(cleaned.Authorization).toBe('[REDACTED]');
      expect(cleaned.jwt).toBe('[REDACTED]');
      expect(cleaned.name).toBe('Alice');
      expect(cleaned.nested.password).toBe('[REDACTED]');
      expect(cleaned.nested.safeKey).toBe('hello');
    });
  });
});

