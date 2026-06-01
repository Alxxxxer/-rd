/**
 * Lightweight, zero-dependency cookie parser middleware.
 * Standardizes cookie headers on req.cookies dictionary object.
 */
const cookieParser = (req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        const name = parts[0].trim();
        const value = decodeURIComponent(parts[1].trim());
        req.cookies[name] = value;
      }
    });
  }

  next();
};

module.exports = cookieParser;
