/**
 * Activity Tracking Routes
 * Handles activity logging and retrieval for admin dashboard
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const GitDatabase = require('../utils/git-database');
const winston = require('winston');

// Initialize Git database
const gitDb = new GitDatabase();

/**
 * GET /api/activity/recent
 * Get recent activities for admin dashboard
 */
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, type, days = 7 } = req.query;
    
    winston.info('Fetching recent activities from Git database');
    
    const activities = await gitDb.getActivityLog(parseInt(limit));
    
    // Filter by type if specified
    let filteredActivities = activities;
    if (type) {
      filteredActivities = activities.filter(activity => 
        activity.message.toLowerCase().includes(type.toLowerCase())
      );
    }
    
    // Filter by date range
    const daysAgo = new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000));
    filteredActivities = filteredActivities.filter(activity => 
      new Date(activity.timestamp) >= daysAgo
    );
    
    // Apply limit
    filteredActivities = filteredActivities.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      activities: filteredActivities,
      total: filteredActivities.length
    });
  } catch (error) {
    winston.error('Activity fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load recent activities from Git database'
    });
  }
});

/**
 * POST /api/activity/log
 * Log a new activity (internal use)
 */
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const { type, description, metadata = {}, user } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Type and description are required'
      });
    }
    
    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      metadata,
      user: user || req.user?.email || 'system',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Read existing activities
    const activityData = await fileManager.readJSON('activity.json');
    if (!activityData.activities) {
      activityData.activities = [];
    }
    
    // Add new activity
    activityData.activities.push(activity);
    
    // Keep only last 1000 activities to prevent file from growing too large
    if (activityData.activities.length > 1000) {
      activityData.activities = activityData.activities.slice(-1000);
    }
    
    // Save updated activities
    await fileManager.writeJSON('activity.json', activityData);
    
    winston.info(`Activity logged: ${type} - ${description}`);
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    winston.error('Activity logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity'
    });
  }
});

/**
 * GET /api/activity/stats
 * Get activity statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const activityData = await fileManager.readJSON('activity.json');
    const activities = activityData.activities || [];
    
    // Filter by date range
    const daysAgo = new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000));
    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= daysAgo
    );
    
    // Calculate statistics
    const stats = {
      total_activities: recentActivities.length,
      by_type: {},
      by_user: {},
      daily_activity: {}
    };
    
    recentActivities.forEach(activity => {
      // Count by type
      stats.by_type[activity.type] = (stats.by_type[activity.type] || 0) + 1;
      
      // Count by user
      stats.by_user[activity.user] = (stats.by_user[activity.user] || 0) + 1;
      
      // Count by day
      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      stats.daily_activity[day] = (stats.daily_activity[day] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats,
      period_days: parseInt(days)
    });
  } catch (error) {
    winston.error('Activity stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load activity statistics'
    });
  }
});

module.exports = router;
