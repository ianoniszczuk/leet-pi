const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = err.details[0].message;
  }

  // Axios errors (HTTP client errors)
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Code judge service unavailable';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = errorHandler;
