/**
 * Auth service (M1) — business logic for registration and login.
 *
 * FR-01: Register new student accounts.
 * FR-02: Authenticate users and issue JWTs.
 * SR-03: Passwords are hashed with bcryptjs (10 rounds); hash never returned.
 * SR-01: JWT payload contains { sub: userId, role }; expiry from env.
 *
 * Security: student identity and role come ONLY from this service's output —
 * never from a request body (CLAUDE.md rule 4).
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

const SALT_ROUNDS = 10;

/**
 * Register a new student.
 * Always assigns role = 'student' regardless of any supplied role field.
 *
 * @param {{ name: string, email: string, password: string }} data
 * @returns {{ userId: string, name: string, email: string, role: string }}
 */
async function register({ name, email, password }) {
  // Check for duplicate email before hashing (fast path)
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'student', // always student — never taken from input (STRIDE: elevation of privilege)
  });

  logger.info('Student registered', { userId: user.id, email: user.email });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Authenticate a user with email and password.
 * Returns the same 401 INVALID_CREDENTIALS for unknown email AND wrong password
 * to prevent user enumeration (SR-01).
 *
 * @param {{ email: string, password: string }} data
 * @returns {{ token: string, role: string, name: string, expiresIn: number }}
 */
async function login({ email, password }) {
  // Must explicitly select passwordHash (select:false on model)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS');
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('INVALID_CREDENTIALS');
  }

  const expiresIn = config.JWT_EXPIRES_IN || 3600;
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.JWT_SECRET,
    { expiresIn }
  );

  logger.info('User logged in', { userId: user.id, role: user.role });

  return { token, role: user.role, name: user.name, expiresIn };
}

module.exports = { register, login };
