const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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

// GET /api/packs - Get all active packs
router.get('/', [
  query('type').optional().isIn(['starter', 'reseller', 'pro']),
  query('status').optional().isIn(['active', 'inactive', 'sold_out']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req, res) => {
  try {
    const { type, status = 'active', limit = 10, offset = 0 } = req.query;
    
    let queryText = `
      SELECT 
        id, name, slug, type, price, deposit_price, units, 
        resale_estimate, description, short_description, image, 
        status, available_quantity, reserved_quantity, created_at
      FROM packs 
      WHERE status = $1
    `;
    const queryParams = [status];
    
    if (type) {
      queryText += ' AND type = $2';
      queryParams.push(type);
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
    logger.error('Error fetching packs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch packs',
      message: error.message 
    });
  }
});

// GET /api/packs/:id - Get pack details with manifest
router.get('/:id', [
  param('id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pack details
    const packResult = await dbQuery(
      'SELECT * FROM packs WHERE id = $1',
      [id]
    );
    
    if (packResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    // Get manifest for this pack
    const manifestResult = await dbQuery(
      `SELECT 
        id, sku, product_name, quantity, condition_grade, 
        description, image, estimated_value, category, brand
      FROM manifests 
      WHERE pack_id = $1 
      ORDER BY category, product_name`,
      [id]
    );
    
    const pack = packResult.rows[0];
    pack.manifest = manifestResult.rows;
    
    res.json({
      success: true,
      data: pack
    });
  } catch (error) {
    logger.error('Error fetching pack details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pack details',
      message: error.message 
    });
  }
});

// GET /api/packs/:id/inventory - Get real-time inventory status
router.get('/:id/inventory', [
  param('id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(
      'SELECT available_quantity, reserved_quantity, status FROM packs WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    const { available_quantity, reserved_quantity, status } = result.rows[0];
    
    res.json({
      success: true,
      data: {
        pack_id: parseInt(id),
        available_quantity,
        reserved_quantity,
        status,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory',
      message: error.message 
    });
  }
});

// POST /api/packs/:id/reserve - Reserve inventory (internal use)
router.post('/:id/reserve', [
  param('id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('order_id').optional().isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, order_id } = req.body;
    
    // Check available inventory
    const packResult = await dbQuery(
      'SELECT available_quantity FROM packs WHERE id = $1 FOR UPDATE',
      [id]
    );
    
    if (packResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    const { available_quantity } = packResult.rows[0];
    
    if (available_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient inventory',
        available: available_quantity,
        requested: quantity
      });
    }
    
    // Reserve inventory
    await dbQuery(
      'UPDATE packs SET available_quantity = available_quantity - $1, reserved_quantity = reserved_quantity + $1 WHERE id = $2',
      [quantity, id]
    );
    
    // Log inventory action
    await dbQuery(
      'INSERT INTO inventory_log (pack_id, action, quantity, order_id) VALUES ($1, $2, $3, $4)',
      [id, 'reserve', quantity, order_id]
    );
    
    res.json({
      success: true,
      message: 'Inventory reserved successfully',
      data: {
        pack_id: parseInt(id),
        quantity_reserved: quantity,
        order_id
      }
    });
  } catch (error) {
    logger.error('Error reserving inventory:', error);
    res.status(500).json({ 
      error: 'Failed to reserve inventory',
      message: error.message 
    });
  }
});

// POST /api/packs/:id/release - Release reserved inventory (internal use)
router.post('/:id/release', [
  param('id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('order_id').optional().isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, order_id } = req.body;
    
    // Check reserved inventory
    const packResult = await dbQuery(
      'SELECT reserved_quantity FROM packs WHERE id = $1 FOR UPDATE',
      [id]
    );
    
    if (packResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    const { reserved_quantity } = packResult.rows[0];
    
    if (reserved_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient reserved inventory',
        reserved: reserved_quantity,
        requested: quantity
      });
    }
    
    // Release inventory
    await dbQuery(
      'UPDATE packs SET available_quantity = available_quantity + $1, reserved_quantity = reserved_quantity - $1 WHERE id = $2',
      [quantity, id]
    );
    
    // Log inventory action
    await dbQuery(
      'INSERT INTO inventory_log (pack_id, action, quantity, order_id) VALUES ($1, $2, $3, $4)',
      [id, 'release', quantity, order_id]
    );
    
    res.json({
      success: true,
      message: 'Inventory released successfully',
      data: {
        pack_id: parseInt(id),
        quantity_released: quantity,
        order_id
      }
    });
  } catch (error) {
    logger.error('Error releasing inventory:', error);
    res.status(500).json({ 
      error: 'Failed to release inventory',
      message: error.message 
    });
  }
});

module.exports = router;
