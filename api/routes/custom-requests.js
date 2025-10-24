/**
 * Custom Requests Routes
 * Handles customer custom pack requests and admin management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const fileManager = require('../utils/file-manager');
const ActivityLogger = require('../utils/activity-logger');
const winston = require('winston');

/**
 * POST /api/custom-packs/request
 * Submit a new custom pack request (public endpoint)
 */
router.post('/request', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      estimated_budget,
      preferred_categories,
      request_description
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_email || !request_description) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and request description are required'
      });
    }

    winston.info(`New custom pack request from: ${customer_email}`);

    // Read existing requests
    let requestsData;
    try {
      requestsData = await fileManager.readJSON('custom-requests.json');
    } catch (error) {
      // Create new file if it doesn't exist
      requestsData = { requests: [] };
    }

    // Generate unique ID
    const requestId = `REQ-${Date.now()}`;
    
    // Create new request object
    const newRequest = {
      id: requestId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone?.trim() || '',
      business_name: business_name?.trim() || '',
      estimated_budget: estimated_budget ? parseFloat(estimated_budget) : null,
      preferred_categories: preferred_categories?.trim() || '',
      request_description: request_description.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: ''
    };

    // Add to requests array
    requestsData.requests.push(newRequest);

    // Save to file
    await fileManager.writeJSON('custom-requests.json', requestsData);

    // Log activity
    await ActivityLogger.logCustomRequestActivity(newRequest, 'created', 'customer');

    winston.info(`Custom request ${requestId} created successfully`);

    res.json({
      success: true,
      message: 'Custom pack request submitted successfully! We will contact you within 24 hours.',
      request_id: requestId
    });

  } catch (error) {
    winston.error('Custom request submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit custom request'
    });
  }
});

/**
 * GET /api/custom-requests
 * Get all custom requests (admin only)
 */
router.get('/', authenticateToken, requirePermission('read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    winston.info('Fetching custom requests');
    
    const requestsData = await fileManager.readJSON('custom-requests.json');
    let requests = requestsData.requests || [];
    
    // Apply status filter if provided
    if (status) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by creation date (newest first)
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      requests: paginatedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: requests.length,
        pages: Math.ceil(requests.length / limit)
      }
    });
  } catch (error) {
    winston.error('Custom requests fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load custom requests'
    });
  }
});

/**
 * GET /api/custom-requests/:id
 * Get specific custom request by ID (admin only)
 */
router.get('/:id', authenticateToken, requirePermission('read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Fetching custom request ${id}`);
    
    const requestsData = await fileManager.readJSON('custom-requests.json');
    const request = requestsData.requests.find(r => r.id === id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Custom request not found'
      });
    }
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    winston.error('Custom request fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load custom request'
    });
  }
});

/**
 * PUT /api/custom-requests/:id/status
 * Update custom request status (admin only)
 */
router.put('/:id/status', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (pending, reviewed, approved, rejected)'
      });
    }
    
    winston.info(`Updating custom request ${id} status to ${status}`);
    
    const requestsData = await fileManager.readJSON('custom-requests.json');
    const requestIndex = requestsData.requests.findIndex(r => r.id === id);
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Custom request not found'
      });
    }
    
    // Update request
    requestsData.requests[requestIndex].status = status;
    requestsData.requests[requestIndex].updated_at = new Date().toISOString();
    
    if (admin_notes) {
      requestsData.requests[requestIndex].admin_notes = admin_notes.trim();
    }
    
    // Save updated data
    await fileManager.writeJSON('custom-requests.json', requestsData);
    
    // Log activity
    await ActivityLogger.logCustomRequestActivity(requestsData.requests[requestIndex], 'status_changed', req.user.email);
    
    winston.info(`Custom request ${id} status updated to ${status}`);
    
    res.json({
      success: true,
      message: 'Request status updated successfully',
      request: requestsData.requests[requestIndex]
    });
    
  } catch (error) {
    winston.error('Custom request status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request status'
    });
  }
});

/**
 * DELETE /api/custom-requests/:id
 * Delete custom request (admin only)
 */
router.delete('/:id', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Deleting custom request ${id}`);
    
    const requestsData = await fileManager.readJSON('custom-requests.json');
    const requestIndex = requestsData.requests.findIndex(r => r.id === id);
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Custom request not found'
      });
    }
    
    // Remove request
    requestsData.requests.splice(requestIndex, 1);
    
    // Save updated data
    await fileManager.writeJSON('custom-requests.json', requestsData);
    
    winston.info(`Custom request ${id} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Custom request deleted successfully'
    });
    
  } catch (error) {
    winston.error('Custom request deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete custom request'
    });
  }
});

module.exports = router;
