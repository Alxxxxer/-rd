const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      status: user.status 
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRE }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null; // Return null so the calling service/middleware handles token failure cleanly
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
