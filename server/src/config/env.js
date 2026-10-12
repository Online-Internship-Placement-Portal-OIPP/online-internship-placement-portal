/**
 * Loads environment variables from .env and exports a frozen config object.
 * Throws if MONGODB_URI or JWT_SECRET is missing (except in test mode).
 */
const path = require('path');

// Load .env from server root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  if (!process.env.MONGODB_URI) {
    throw new Error('FATAL: MONGODB_URI environment variable is required. Check your .env file.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Check your .env file.');
  }
}

const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
  JWT_EXPIRES_IN: parseInt(process.env.JWT_EXPIRES_IN, 10) || 3600,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
});

module.exports = config;

