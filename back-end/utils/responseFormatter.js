/**
 * Utility functions for formatting API responses
 */

const formatSuccessResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

const formatErrorResponse = (message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    response.error.details = details;
  }

  return response;
};

const formatPaginationResponse = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
  formatPaginationResponse,
};
