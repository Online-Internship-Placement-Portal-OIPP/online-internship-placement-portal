/**
 * MongoDB connection helpers using Mongoose.
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB.
 * @param {string} uri - MongoDB connection string.
 */
async function connectDB(uri) {
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

/**
 * Disconnect from MongoDB.
 */
async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

/**
 * Check whether the database connection is active.
 * @returns {boolean} true if readyState is 1 (connected).
 */
function isDbUp() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, isDbUp };

