/**
 * Role-Based Authorization Middleware
 * Restricts access to routes based on user roles
 * Must be used after the protect middleware
 */

/**
 * Authorize middleware factory
 * Creates middleware that checks if user has required role(s)
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} - Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Please login first'
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 * Shorthand for authorize('admin')
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Please login first'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Admin privileges required'
    });
  }

  next();
};

/**
 * Check resource ownership middleware factory
 * Verifies that the user owns the resource or is an admin
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} - Express middleware function
 */
const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      // Allow if user is admin or owns the resource
      if (req.user.role === 'admin' || req.user._id.toString() === resourceOwnerId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only modify your own resources'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = { authorize, adminOnly, checkOwnership };
