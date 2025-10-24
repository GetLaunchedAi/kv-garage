/**
 * Activity Logger Utility
 * Provides centralized activity logging for the admin system
 */

const fileManager = require('./file-manager');
const winston = require('winston');

class ActivityLogger {
  /**
   * Log an activity
   * @param {string} type - Activity type (order_created, pack_updated, etc.)
   * @param {string} description - Human-readable description
   * @param {Object} metadata - Additional data about the activity
   * @param {string} user - User who performed the action
   */
  static async logActivity(type, description, metadata = {}, user = 'system') {
    try {
      const activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        description,
        metadata,
        user,
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

      winston.info(`Activity logged: ${type} - ${description}`, { user, metadata });
      
      return activity;
    } catch (error) {
      winston.error('Activity logging error:', error);
      // Don't throw error - activity logging should not break main functionality
    }
  }

  /**
   * Log order-related activities
   */
  static async logOrderActivity(order, action, user = 'system') {
    const activities = {
      created: {
        type: 'order_created',
        description: `New order #${order.id} placed by ${order.customer_name || order.customer_email}`
      },
      status_changed: {
        type: 'order_status_changed',
        description: `Order #${order.id} status changed to ${order.status}`
      },
      updated: {
        type: 'order_updated',
        description: `Order #${order.id} details updated`
      },
      cancelled: {
        type: 'order_cancelled',
        description: `Order #${order.id} was cancelled`
      }
    };

    const activity = activities[action];
    if (activity) {
      return await this.logActivity(
        activity.type,
        activity.description,
        {
          order_id: order.id,
          order_status: order.status,
          customer_email: order.customer_email,
          total_amount: order.total_amount
        },
        user
      );
    }
  }

  /**
   * Log pack-related activities
   */
  static async logPackActivity(pack, action, user = 'system') {
    const activities = {
      created: {
        type: 'pack_created',
        description: `New pack "${pack.name}" created`
      },
      updated: {
        type: 'pack_updated',
        description: `Pack "${pack.name}" updated`
      },
      deleted: {
        type: 'pack_deleted',
        description: `Pack "${pack.name}" deleted`
      }
    };

    const activity = activities[action];
    if (activity) {
      return await this.logActivity(
        activity.type,
        activity.description,
        {
          pack_id: pack.id,
          pack_name: pack.name,
          pack_status: pack.status
        },
        user
      );
    }
  }

  /**
   * Log manifest-related activities
   */
  static async logManifestActivity(pack, action, user = 'system', metadata = {}) {
    const activities = {
      uploaded: {
        type: 'manifest_uploaded',
        description: `Manifest uploaded for pack "${pack.name}"`
      },
      processed: {
        type: 'manifest_processed',
        description: `Manifest processed for pack "${pack.name}"`
      }
    };

    const activity = activities[action];
    if (activity) {
      return await this.logActivity(
        activity.type,
        activity.description,
        {
          pack_id: pack.id,
          pack_name: pack.name,
          ...metadata
        },
        user
      );
    }
  }

  /**
   * Log custom request activities
   */
  static async logCustomRequestActivity(request, action, user = 'system') {
    const activities = {
      created: {
        type: 'custom_request_created',
        description: `New custom pack request from ${request.customer_name || request.customer_email}`
      },
      status_changed: {
        type: 'custom_request_status_changed',
        description: `Custom request status changed to ${request.status}`
      },
      reviewed: {
        type: 'custom_request_reviewed',
        description: `Custom request reviewed by admin`
      },
      approved: {
        type: 'custom_request_approved',
        description: `Custom request approved`
      },
      rejected: {
        type: 'custom_request_rejected',
        description: `Custom request rejected`
      }
    };

    const activity = activities[action];
    if (activity) {
      return await this.logActivity(
        activity.type,
        activity.description,
        {
          request_id: request.id,
          customer_email: request.customer_email,
          status: request.status
        },
        user
      );
    }
  }

  /**
   * Log admin activities
   */
  static async logAdminActivity(action, description, user = 'system', metadata = {}) {
    return await this.logActivity(
      'admin_action',
      description,
      {
        action,
        ...metadata
      },
      user
    );
  }

  /**
   * Log system activities
   */
  static async logSystemActivity(action, description, metadata = {}) {
    return await this.logActivity(
      'system_action',
      description,
      {
        action,
        ...metadata
      },
      'system'
    );
  }
}

module.exports = ActivityLogger;
