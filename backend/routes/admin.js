const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query: dbQuery, transaction } = require('../config/database');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

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

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get admin user
    const result = await dbQuery(
      'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get total packs
    const packsResult = await dbQuery('SELECT COUNT(*) as total FROM packs');
    
    // Get active orders
    const ordersResult = await dbQuery(
      'SELECT COUNT(*) as total FROM orders WHERE status IN ($1, $2)',
      ['paid', 'deposit_paid']
    );
    
    // Get orders today
    const todayOrdersResult = await dbQuery(
      'SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE'
    );
    
    // Get revenue this month
    const revenueResult = await dbQuery(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM orders 
       WHERE status = 'paid' 
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    res.json({
      success: true,
      data: {
        total_packs: parseInt(packsResult.rows[0].total),
        active_orders: parseInt(ordersResult.rows[0].total),
        orders_today: parseInt(todayOrdersResult.rows[0].total),
        revenue_this_month: parseFloat(revenueResult.rows[0].total)
      }
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
});

// POST /api/admin/packs - Create new pack
router.post('/packs', authenticateAdmin, [
  body('name').isLength({ min: 2, max: 255 }),
  body('type').isIn(['starter', 'reseller', 'pro']),
  body('price').isDecimal({ decimal_digits: '0,2' }),
  body('deposit_price').isDecimal({ decimal_digits: '0,2' }),
  body('units').isInt({ min: 1 }),
  body('resale_estimate').optional().isDecimal({ decimal_digits: '0,2' }),
  body('description').optional().isLength({ max: 2000 }),
  body('short_description').optional().isLength({ max: 500 }),
  body('image').optional().isURL(),
  body('available_quantity').isInt({ min: 0 })
], validateRequest, async (req, res) => {
  try {
    const {
      name, type, price, deposit_price, units, resale_estimate,
      description, short_description, image, available_quantity
    } = req.body;

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const result = await dbQuery(
      `INSERT INTO packs (
        name, slug, type, price, deposit_price, units, resale_estimate,
        description, short_description, image, available_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name, slug, type, price, deposit_price, units, resale_estimate,
        description, short_description, image, available_quantity
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Pack created successfully'
    });

  } catch (error) {
    logger.error('Error creating pack:', error);
    res.status(500).json({ 
      error: 'Failed to create pack',
      message: error.message 
    });
  }
});

// PUT /api/admin/packs/:id - Update pack
router.put('/packs/:id', authenticateAdmin, [
  param('id').isInt({ min: 1 }),
  body('name').optional().isLength({ min: 2, max: 255 }),
  body('type').optional().isIn(['starter', 'reseller', 'pro']),
  body('price').optional().isDecimal({ decimal_digits: '0,2' }),
  body('deposit_price').optional().isDecimal({ decimal_digits: '0,2' }),
  body('units').optional().isInt({ min: 1 }),
  body('resale_estimate').optional().isDecimal({ decimal_digits: '0,2' }),
  body('description').optional().isLength({ max: 2000 }),
  body('short_description').optional().isLength({ max: 500 }),
  body('image').optional().isURL(),
  body('status').optional().isIn(['active', 'inactive', 'sold_out']),
  body('available_quantity').optional().isInt({ min: 0 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE packs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await dbQuery(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Pack updated successfully'
    });

  } catch (error) {
    logger.error('Error updating pack:', error);
    res.status(500).json({ 
      error: 'Failed to update pack',
      message: error.message 
    });
  }
});

// POST /api/admin/manifests/upload - Upload manifest CSV
router.post('/manifests/upload', authenticateAdmin, upload.single('manifest'), [
  body('pack_id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { pack_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify pack exists
    const packResult = await dbQuery('SELECT id FROM packs WHERE id = $1', [pack_id]);
    if (packResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    const manifestItems = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (row) => {
          manifestItems.push({
            pack_id: parseInt(pack_id),
            sku: row.sku || row.SKU,
            product_name: row.product_name || row['Product Name'],
            quantity: parseInt(row.quantity || row.Quantity),
            condition_grade: row.condition || row.Condition || 'A',
            description: row.description || row.Description,
            image: row.image || row.Image,
            estimated_value: parseFloat(row.estimated_value || row['Est. Value'] || 0),
            category: row.category || row.Category,
            brand: row.brand || row.Brand
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert manifest items
    await transaction(async (client) => {
      // Clear existing manifest for this pack
      await client.query('DELETE FROM manifests WHERE pack_id = $1', [pack_id]);

      // Insert new manifest items
      for (const item of manifestItems) {
        await client.query(
          `INSERT INTO manifests (
            pack_id, sku, product_name, quantity, condition_grade,
            description, image, estimated_value, category, brand
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            item.pack_id, item.sku, item.product_name, item.quantity,
            item.condition_grade, item.description, item.image,
            item.estimated_value, item.category, item.brand
          ]
        );
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      message: 'Manifest uploaded successfully',
      data: {
        pack_id: parseInt(pack_id),
        items_count: manifestItems.length
      }
    });

  } catch (error) {
    logger.error('Error uploading manifest:', error);
    
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload manifest',
      message: error.message 
    });
  }
});

// GET /api/admin/orders - Get orders with filtering
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        o.*, 
        p.name as pack_name, 
        p.type as pack_type
      FROM orders o 
      JOIN packs p ON o.pack_id = p.id
    `;
    const queryParams = [];

    if (status) {
      queryText += ' WHERE o.status = $1';
      queryParams.push(status);
    }

    queryText += ' ORDER BY o.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
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
    logger.error('Error fetching orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message 
    });
  }
});

// GET /api/admin/analytics - Get sales analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Sales by pack type
    const salesByTypeResult = await dbQuery(
      `SELECT 
        p.type,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_revenue
      FROM orders o
      JOIN packs p ON o.pack_id = p.id
      WHERE o.status = 'paid' 
      AND o.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY p.type
      ORDER BY total_revenue DESC`
    );

    // Daily sales for the period
    const dailySalesResult = await dbQuery(
      `SELECT 
        DATE(o.created_at) as date,
        COUNT(o.id) as orders,
        SUM(o.amount) as revenue
      FROM orders o
      WHERE o.status = 'paid' 
      AND o.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC`
    );

    // Payment type breakdown
    const paymentTypeResult = await dbQuery(
      `SELECT 
        payment_type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM orders
      WHERE status = 'paid'
      AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY payment_type`
    );

    res.json({
      success: true,
      data: {
        sales_by_type: salesByTypeResult.rows,
        daily_sales: dailySalesResult.rows,
        payment_breakdown: paymentTypeResult.rows,
        period_days: parseInt(period)
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
});

// GET /api/admin/custom-requests - Get custom pack requests
router.get('/custom-requests', authenticateAdmin, async (req, res) => {
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
      data: result.rows
    });

  } catch (error) {
    logger.error('Error fetching custom requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch custom requests',
      message: error.message 
    });
  }
});

// PUT /api/admin/custom-requests/:id/status - Update custom request status
router.put('/custom-requests/:id/status', authenticateAdmin, [
  param('id').isUUID(),
  body('status').isIn(['pending', 'reviewed', 'quoted', 'approved', 'rejected']),
  body('admin_notes').optional().isLength({ max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Check if request exists
    const requestResult = await dbQuery(
      'SELECT * FROM custom_pack_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Custom request not found' 
      });
    }

    // Update request status
    const updateResult = await dbQuery(
      'UPDATE custom_pack_requests SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, admin_notes, id]
    );

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Custom request status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating custom request status:', error);
    res.status(500).json({ 
      error: 'Failed to update custom request status',
      message: error.message 
    });
  }
});

// GET /api/admin/inventory - Get inventory overview
router.get('/inventory', authenticateAdmin, async (req, res) => {
  try {
    // Get pack inventory with real-time quantities
    const inventoryResult = await dbQuery(`
      SELECT 
        p.id,
        p.name,
        p.type,
        p.number_of_units as initial_quantity,
        COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) as current_quantity,
        COUNT(CASE WHEN o.status IN ('pending', 'reserved', 'completed') THEN 1 END) as orders_count
      FROM packs p
      LEFT JOIN inventory_log il ON p.id = il.pack_id
      LEFT JOIN orders o ON p.id = o.pack_id
      GROUP BY p.id, p.name, p.type, p.number_of_units
      ORDER BY p.created_at DESC
    `);

    // Get low stock packs (less than 5 remaining)
    const lowStockResult = await dbQuery(`
      SELECT 
        p.id,
        p.name,
        p.type,
        COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) as current_quantity
      FROM packs p
      LEFT JOIN inventory_log il ON p.id = il.pack_id
      GROUP BY p.id, p.name, p.type, p.number_of_units
      HAVING COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) < 5
      ORDER BY current_quantity ASC
    `);

    res.json({
      success: true,
      data: {
        inventory: inventoryResult.rows,
        lowStock: lowStockResult.rows
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

module.exports = router;
