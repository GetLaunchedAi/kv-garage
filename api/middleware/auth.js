/**
 * Authentication Middleware
 * Handles JWT token generation, validation, and user authentication
 */

const jwt = require('jsonwebtoken');
const winston = require('winston');

// Smart Environment Detection
const isProduction = process.env.NODE_ENV === 'production';

// JWT configuration with environment-specific secrets
const JWT_SECRET = process.env.JWT_SECRET || (isProduction 
  ? 'kv-garage-production-secret-key-change-this' 
  : 'kv-garage-dev-secret-key');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Environment logging
console.log(`🔐 Auth Middleware - Environment: ${isProduction ? 'production' : 'localhost'}`);
console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);

// Demo admin credentials (replace with real authentication in production)
const ADMIN_CREDENTIALS = {
  id: 1,
  email: 'admin@kvgarage.com',
  password: 'admin123',
  name: 'KV Garage Admin',
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'upload']
};

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'kv-garage-api',
      audience: 'kv-garage-admin'
    });

    winston.info(`Token generated for user: ${user.email}`);
    return token;
  } catch (error) {
    winston.error('Token generation failed:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'kv-garage-api',
      audience: 'kv-garage-admin'
    });
    
    winston.info(`Token verified for user: ${decoded.email}`);
    return decoded;
  } catch (error) {
    winston.warn('Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware to authenticate requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      winston.warn('Authentication failed: No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    winston.warn('Authentication failed:', error.message);
    return res.status(403).json({
      success: false,
      error: error.message,
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware to check user permissions
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userPermissions = req.user.permissions || [];
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const hasPermission = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        winston.warn(`Permission denied for user ${req.user.email}: ${permissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissions
        });
      }

      next();
    } catch (error) {
      winston.error('Permission check failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * Middleware to check admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (req.user.role !== 'admin') {
      winston.warn(`Admin access denied for user ${req.user.email} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    winston.error('Admin check failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin check failed',
      code: 'ADMIN_ERROR'
    });
  }
};

/**
 * Authenticate user credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Authentication result
 */
const authenticateUser = (email, password) => {
  try {
    // In production, this would query a database
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      winston.info(`User authenticated: ${email}`);
      return {
        success: true,
        user: {
          id: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role,
          permissions: ADMIN_CREDENTIALS.permissions
        }
      };
    } else {
      winston.warn(`Authentication failed for email: ${email}`);
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  } catch (error) {
    winston.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
};

/**
 * Get user info from token
 * @param {string} token - JWT token
 * @returns {Object} User information
 */
const getUserFromToken = (token) => {
  try {
    const decoded = verifyToken(token);
    return {
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        permissions: decoded.permissions
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requirePermission,
  requireAdmin,
  authenticateUser,
  getUserFromToken,
  ADMIN_CREDENTIALS
};
