const crypto = require('crypto');

/**
 * Generate a random token for password resets
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a plain text token using SHA-256 for secure DB comparison
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateRandomToken,
  hashToken
};
