/**
 * Utility functions for formatting API responses
 */

export const formatSuccessResponse = (data: any, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

export const formatErrorResponse = (message: string, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      details
    },
  }
};

export const formatPaginationResponse = (data: any, page: number, limit: number, total: number) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  };
};
