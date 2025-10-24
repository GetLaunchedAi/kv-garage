/**
 * Admin Authentication Routes
 * Handles login, logout, and user verification
 */

const express = require('express');
const router = express.Router();
const { 
  generateToken, 
  authenticateToken, 
  authenticateUser, 
  getUserFromToken 
} = require('../middleware/auth');
const winston = require('winston');

/**
 * POST /api/admin/login
 * Authenticate admin user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Authenticate user
    const authResult = authenticateUser(email, password);
    
    if (!authResult.success) {
      winston.warn(`Login attempt failed for email: ${email}`);
      return res.status(401).json({
        success: false,
        error: authResult.error
      });
    }

    // Generate JWT token
    const token = generateToken(authResult.user);

    winston.info(`Admin login successful: ${email}`);
    
    res.json({
      success: true,
      token,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
        permissions: authResult.user.permissions
      },
      expires_in: '24h'
    });

  } catch (error) {
    winston.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * GET /api/admin/verify
 * Verify JWT token and return user info
 */
router.get('/verify', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        permissions: req.user.permissions
      }
    });
  } catch (error) {
    winston.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

/**
 * POST /api/admin/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token with same user info
    const newToken = generateToken(req.user);
    
    winston.info(`Token refreshed for user: ${req.user.email}`);
    
    res.json({
      success: true,
      token: newToken,
      expires_in: '24h'
    });
  } catch (error) {
    winston.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/admin/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    winston.info(`Admin logout: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    winston.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/admin/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      profile: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        permissions: req.user.permissions,
        last_login: new Date().toISOString()
      }
    });
  } catch (error) {
    winston.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const fileManager = require('../utils/file-manager');
    
    // Get basic stats from JSON files
    const [packsData, manifestsData, ordersData] = await Promise.all([
      fileManager.readJSON('packs.json').catch(() => ({ packs: [] })),
      fileManager.readJSON('manifests.json').catch(() => ({ manifests: {} })),
      fileManager.readJSON('orders.json').catch(() => ({ orders: [] }))
    ]);

    const stats = {
      packs: {
        total: packsData.packs.length,
        active: packsData.packs.filter(p => p.status !== 'inactive').length
      },
      manifests: {
        total_packs: Object.keys(manifestsData.manifests).length,
        total_items: Object.values(manifestsData.manifests)
          .reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0)
      },
      orders: {
        total: ordersData.orders.length,
        pending: ordersData.orders.filter(o => o.status === 'pending').length,
        completed: ordersData.orders.filter(o => o.status === 'completed').length
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    winston.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
