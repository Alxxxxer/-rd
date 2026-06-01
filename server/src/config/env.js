const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnv = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI'
];

// Check for required env variables
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[CRITICAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'superadmin@salescrm.com',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456'
};
