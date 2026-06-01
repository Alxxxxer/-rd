const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down server safely...', err);
  process.exit(1);
});

// Connect to Database
connectDB();

// Start Express Server
const server = app.listen(env.PORT, () => {
  logger.info(`Server is running in [${env.NODE_ENV}] mode on port: ${env.PORT}`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down server gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});
