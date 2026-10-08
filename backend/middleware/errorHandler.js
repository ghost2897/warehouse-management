/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error encountered:', {
    message: err.message,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle MariaDB / MySQL specific errors
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(409).json({
      success: false,
      message: 'Foreign key constraint violation: referenced record cannot be modified or does not exist.',
      details: err.message
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this identifier already exists.',
      details: err.message
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

/**
 * 404 Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

