const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// POST /api/custom-packs/request - Submit custom pack request
router.post('/request', [
  body('customer_name').isLength({ min: 2, max: 255 }),
  body('customer_email').isEmail(),
  body('customer_phone').optional().isLength({ min: 10, max: 20 }),
  body('business_name').optional().isLength({ max: 255 }),
  body('request_description').isLength({ min: 10, max: 2000 }),
  body('estimated_budget').optional().isDecimal({ decimal_digits: '0,2' }),
  body('preferred_categories').optional().isLength({ max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      request_description,
      estimated_budget,
      preferred_categories
    } = req.body;

    const result = await dbQuery(
      `INSERT INTO custom_pack_requests (
        customer_name, customer_email, customer_phone, business_name,
        request_description, estimated_budget, preferred_categories
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        customer_name, customer_email, customer_phone, business_name,
        request_description, estimated_budget, preferred_categories
      ]
    );

    // TODO: Send notification email to admin
    logger.info('Custom pack request submitted:', {
      id: result.rows[0].id,
      customer_email,
      business_name
    });

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Custom pack request submitted successfully. We will contact you within 24 hours.'
    });

  } catch (error) {
    logger.error('Error submitting custom pack request:', error);
    res.status(500).json({ 
      error: 'Failed to submit custom pack request',
      message: error.message 
    });
  }
});

// GET /api/custom-packs/requests - Get custom pack requests (admin only)
router.get('/requests', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM custom_pack_requests';
    const queryParams = [];

    if (status) {
      queryText += ' WHERE status = $1';
      queryParams.push(status);
    }

    queryText += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await dbQuery(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });

  } catch (error) {
    logger.error('Error fetching custom pack requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch custom pack requests',
      message: error.message 
    });
  }
});

// PUT /api/custom-packs/requests/:id/status - Update request status (admin only)
router.put('/requests/:id/status', [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['pending', 'reviewed', 'quoted', 'accepted', 'rejected']),
  body('admin_notes').optional().isLength({ max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const result = await dbQuery(
      'UPDATE custom_pack_requests SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom pack request not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Request status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating custom pack request status:', error);
    res.status(500).json({ 
      error: 'Failed to update request status',
      message: error.message 
    });
  }
});

module.exports = router;
