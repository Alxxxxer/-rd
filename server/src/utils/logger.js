const env = require('../config/env');

const levels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

const logger = {
  info: (message) => {
    console.log(formatMessage(levels.INFO, message));
  },
  warn: (message) => {
    console.warn(formatMessage(levels.WARN, message));
  },
  error: (message, error) => {
    let msg = message;
    if (error && error.stack) {
      msg += `\nStack: ${error.stack}`;
    } else if (error) {
      msg += ` - Details: ${JSON.stringify(error)}`;
    }
    console.error(formatMessage(levels.ERROR, msg));
  },
  debug: (message) => {
    if (env.NODE_ENV === 'development') {
      console.log(formatMessage(levels.DEBUG, message));
    }
  }
};

module.exports = logger;
