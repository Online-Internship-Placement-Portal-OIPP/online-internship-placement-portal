/**
 * Entry point: connects to MongoDB, starts the HTTP server,
 * and handles graceful shutdown.
 */
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

async function start() {
  try {
    await connectDB(config.MONGODB_URI);

    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Failed to start server', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
