/**
 * Order Management Routes
 * Handles order viewing and status updates
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const fileManager = require('../utils/file-manager');
const ActivityLogger = require('../utils/activity-logger');
const winston = require('winston');

/**
 * GET /api/orders
 * Get all orders with filtering and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      date_from, 
      date_to,
      customer_email,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    winston.info('Fetching orders');
    
    const ordersData = await fileManager.readJSON('orders.json');
    let orders = ordersData.orders || [];
    
    // Apply filters
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    if (customer_email) {
      orders = orders.filter(order => 
        order.customer_email && 
        order.customer_email.toLowerCase().includes(customer_email.toLowerCase())
      );
    }
    
    if (date_from) {
      const fromDate = new Date(date_from);
      orders = orders.filter(order => new Date(order.created_at) >= fromDate);
    }
    
    if (date_to) {
      const toDate = new Date(date_to);
      orders = orders.filter(order => new Date(order.created_at) <= toDate);
    }
    
    // Apply sorting
    orders.sort((a, b) => {
      const aValue = a[sort_by];
      const bValue = b[sort_by];
      
      if (sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    // Calculate summary statistics
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      total_value: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    };
    
    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.length,
        pages: Math.ceil(orders.length / limit)
      },
      stats
    });
  } catch (error) {
    winston.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load orders'
    });
  }
});

/**
 * GET /api/orders/:id
 * Get specific order by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Fetching order ${id}`);
    
    const ordersData = await fileManager.readJSON('orders.json');
    const order = ordersData.orders.find(o => o.id === id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    winston.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load order'
    });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 */
router.put('/:id/status', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'reserved', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    winston.info(`Updating order ${id} status to ${status}`);
    
    const ordersData = await fileManager.readJSON('orders.json');
    const orderIndex = ordersData.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order status
    const order = ordersData.orders[orderIndex];
    const previousStatus = order.status;
    
    order.status = status;
    order.updated_at = new Date().toISOString();
    order.updated_by = req.user.email;
    
    // Add status change to history
    if (!order.status_history) {
      order.status_history = [];
    }
    
    order.status_history.push({
      status: status,
      changed_at: new Date().toISOString(),
      changed_by: req.user.email,
      notes: notes || null
    });
    
    await fileManager.writeJSON('orders.json', ordersData);
    
    // Log activity
    await ActivityLogger.logOrderActivity(order, 'status_changed', req.user.email);
    
    winston.info(`Order ${id} status updated from ${previousStatus} to ${status}`);
    
    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`,
      status_change: {
        from: previousStatus,
        to: status,
        changed_at: order.updated_at,
        changed_by: req.user.email
      }
    });
  } catch (error) {
    winston.error('Order status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * PUT /api/orders/:id
 * Update order details
 */
router.put('/:id', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    winston.info(`Updating order ${id}`);
    
    const ordersData = await fileManager.readJSON('orders.json');
    const orderIndex = ordersData.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order with new data
    ordersData.orders[orderIndex] = {
      ...ordersData.orders[orderIndex],
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    await fileManager.writeJSON('orders.json', ordersData);
    
    // Log activity
    await ActivityLogger.logOrderActivity(ordersData.orders[orderIndex], 'updated', req.user.email);
    
    winston.info(`Order ${id} updated successfully`);
    
    res.json({
      success: true,
      data: ordersData.orders[orderIndex],
      message: 'Order updated successfully'
    });
  } catch (error) {
    winston.error('Order update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

/**
 * GET /api/orders/stats/summary
 * Get order statistics summary
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    winston.info('Fetching order statistics');
    
    const ordersData = await fileManager.readJSON('orders.json');
    const orders = ordersData.orders || [];
    
    // Calculate date range
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Filter orders by date range
    const recentOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    );
    
    // Calculate statistics
    const stats = {
      period: period,
      date_range: {
        from: startDate.toISOString(),
        to: now.toISOString()
      },
      orders: {
        total: recentOrders.length,
        pending: recentOrders.filter(o => o.status === 'pending').length,
        processing: recentOrders.filter(o => o.status === 'processing').length,
        shipped: recentOrders.filter(o => o.status === 'shipped').length,
        completed: recentOrders.filter(o => o.status === 'completed').length,
        cancelled: recentOrders.filter(o => o.status === 'cancelled').length
      },
      revenue: {
        total: recentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        average: recentOrders.length > 0 ? 
          recentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / recentOrders.length : 0
      },
      trends: {
        daily_orders: this.calculateDailyTrends(recentOrders),
        status_distribution: this.calculateStatusDistribution(recentOrders)
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    winston.error('Order statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load order statistics'
    });
  }
});

/**
 * Calculate daily order trends
 * @param {Array} orders - Array of orders
 * @returns {Object} Daily trends data
 */
function calculateDailyTrends(orders) {
  const trends = {};
  
  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (!trends[date]) {
      trends[date] = { count: 0, revenue: 0 };
    }
    trends[date].count++;
    trends[date].revenue += order.total_amount || 0;
  });
  
  return trends;
}

/**
 * Calculate status distribution
 * @param {Array} orders - Array of orders
 * @returns {Object} Status distribution
 */
function calculateStatusDistribution(orders) {
  const distribution = {};
  
  orders.forEach(order => {
    const status = order.status || 'unknown';
    distribution[status] = (distribution[status] || 0) + 1;
  });
  
  return distribution;
}

module.exports = router;
