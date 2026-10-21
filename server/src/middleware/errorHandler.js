// src/middleware/errorHandler.js
//
// In Express, an error-handling middleware MUST have 4 arguments: (err, req, res, next).
// Even if you don't use `next`, Express checks `fn.length === 4` via Function.prototype.length.
// If you only give it 3 args (err, req, res), Express treats it as a normal middleware!

const {
  ValidationError,
  NotFoundError,
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require('objection');

function errorHandler(err, req, res, next) {
  // Log full error details for server logs
  console.error('🔥 Error caught by global handler:', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 1. Objection.js Model Validation error (e.g., schema validation fails)
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      type: err.type,
      data: err.data
    });
  }

  // 2. Objection.js NotFoundError (e.g., .findById().throwIfNotFound())
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Resource not found'
    });
  }

  // 3. PostgreSQL Unique constraint violation (e.g. duplicate email or duplicate budget)
  if (err instanceof UniqueViolationError || err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict: A record with this information already exists',
      columns: err.columns || undefined
    });
  }

  // 4. PostgreSQL Foreign Key violation (e.g. invalid category_id or user_id)
  if (err instanceof ForeignKeyViolationError || err.code === '23503') {
    return res.status(400).json({
      error: 'Invalid reference: Related resource does not exist'
    });
  }

  // 5. PostgreSQL NOT NULL violation (e.g. missing required database column)
  if (err instanceof NotNullViolationError || err.code === '23502') {
    return res.status(400).json({
      error: `Missing required field: ${err.column || 'check request payload'}`
    });
  }

  // 6. JWT Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token, please log in again'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Session expired, please log in again'
    });
  }

  // 7. Custom application errors with status code (e.g., `const err = new Error(); err.status = 400;`)
  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
}

module.exports = errorHandler;
