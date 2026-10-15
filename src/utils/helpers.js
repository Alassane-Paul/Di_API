/**
 * Utility functions for the Di backend
 */

/**
 * Format a standard success response
 */
const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * Format a standard error response
 */
const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ error: message });
};

/**
 * Async wrapper to avoid try/catch boilerplate in controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Paginate Sequelize results
 */
const paginate = ({ page = 1, pageSize = 20 } = {}) => {
  const offset = (page - 1) * pageSize;
  return { offset, limit: pageSize };
};

/**
 * Parse boolean from query/body
 */
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/**
 * Sanitize user object (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.deviceId;
  return obj;
};

/**
 * Generate a random integer between min and max (inclusive)
 */
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  successResponse,
  errorResponse,
  asyncHandler,
  paginate,
  parseBoolean,
  sanitizeUser,
  randomInt,
  sleep,
};
