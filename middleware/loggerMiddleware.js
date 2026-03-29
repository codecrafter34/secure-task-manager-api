const logger = require('../config/logger');

/**
 * Request Logger Middleware
 * Logs all incoming HTTP requests with method, URL, status code, and response time
 * Sanitizes sensitive data from being logged
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response details
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    let logLevel = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'warn';
    } else if (statusCode >= 500) {
      logLevel = 'error';
    }
    
    // Build log data (sanitize query params)
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100) // Truncate long user agents
    };
    
    // Add user ID if authenticated (but not the full user object)
    if (req.user?._id) {
      logData.userId = req.user._id.toString();
    }
    
    // Log the request
    logger[logLevel](`${req.method} ${req.originalUrl || req.url} ${statusCode}`, logData);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error Logger Middleware
 * Logs all errors with stack traces
 * Must be placed after routes but before error handler
 */
const errorLogger = (err, req, res, next) => {
  // Build error log data
  const errorData = {
    method: req.method,
    url: req.originalUrl || req.url,
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  };
  
  // Add user ID if authenticated
  if (req.user?._id) {
    errorData.userId = req.user._id.toString();
  }
  
  // Add sanitized request body for debugging (excluding sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    errorData.body = logger.sanitize(req.body);
  }
  
  // Log the error
  logger.error(`Error: ${err.message}`, errorData);
  
  // Pass to next error handler
  next(err);
};

module.exports = { requestLogger, errorLogger };
