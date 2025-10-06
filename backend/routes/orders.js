const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query: dbQuery, transaction } = require('../config/database');
const { logger } = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// POST /api/orders/create-checkout-session - Create Stripe checkout session directly
router.post('/create-checkout-session', [
  body('packId').isUUID(),
  body('mode').isIn(['full', 'deposit']),
  body('customer_email').optional().isEmail(),
  body('customer_name').optional().isLength({ min: 2, max: 255 })
], validateRequest, async (req, res) => {
  try {
    const { packId, mode, customer_email, customer_name } = req.body;

    // Get pack details with current inventory
    const packResult = await dbQuery(
      `SELECT p.*, 
              COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) as available_quantity
       FROM packs p
       LEFT JOIN inventory_log il ON p.id = il.pack_id
       WHERE p.id = $1 AND p.status = 'available'
       GROUP BY p.id`,
      [packId]
    );

    if (packResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found or not available' 
      });
    }

    const pack = packResult.rows[0];

    // Check inventory availability
    if (pack.available_quantity < 1) {
      return res.status(400).json({ 
        error: 'Pack is out of stock' 
      });
    }

    // Calculate amounts
    const amount = mode === 'full' ? pack.price : pack.deposit_price;
    const depositAmount = mode === 'deposit' ? pack.deposit_price : 0;
    const remainingAmount = mode === 'deposit' ? pack.price - pack.deposit_price : 0;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pack.name} - Wholesale Pack`,
              description: `${pack.description || 'Curated wholesale tech pack'}`,
              images: pack.image_url ? [pack.image_url] : [],
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/packs/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/packs/${packId}/`,
      metadata: {
        pack_id: packId,
        payment_mode: mode,
        pack_name: pack.name,
        pack_price: pack.price.toString(),
        deposit_price: pack.deposit_price ? pack.deposit_price.toString() : '0',
        remaining_amount: remainingAmount.toString()
      },
      customer_email: customer_email,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    });

    // Create order record in database
    const orderResult = await dbQuery(
      `INSERT INTO orders (
        customer_email, customer_name, pack_id, payment_mode, 
        amount_paid, total_amount, stripe_checkout_session_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        customer_email || null,
        customer_name || null,
        packId,
        mode,
        amount,
        pack.price,
        session.id,
        'pending'
      ]
    );

    const order = orderResult.rows[0];

    res.json({
      success: true,
      sessionUrl: session.url,
      sessionId: session.id,
      orderId: order.id,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// POST /api/orders/:id/checkout - Initialize Stripe checkout session
router.post('/:id/checkout', [
  param('id').isInt({ min: 1 }),
  body('payment_type').isIn(['full', 'deposit'])
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_type } = req.body;

    // Get order details
    const orderResult = await dbQuery(
      `SELECT o.*, p.name as pack_name, p.type as pack_type 
       FROM orders o 
       JOIN packs p ON o.pack_id = p.id 
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    const order = orderResult.rows[0];

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Order is not in pending status' 
      });
    }

    // Calculate amount based on payment type
    const amount = payment_type === 'full' ? order.amount : order.deposit_amount;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${order.pack_name} - ${order.pack_type} Pack`,
              description: `Wholesale pack order - ${payment_type} payment`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/packs/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/packs/?cancelled=true&order_id=${order.id}`,
      metadata: {
        order_id: order.id.toString(),
        payment_type: payment_type,
        pack_id: order.pack_id.toString()
      },
      customer_email: order.customer_email,
    });

    // Update order with Stripe session ID
    await dbQuery(
      'UPDATE orders SET stripe_session_id = $1 WHERE id = $2',
      [session.id, order.id]
    );

    res.json({
      success: true,
      data: {
        checkout_url: session.url,
        session_id: session.id
      }
    });

  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// GET /api/orders/session/:sessionId - Get order details by Stripe session ID
router.get('/session/:sessionId', [
  param('sessionId').isLength({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await dbQuery(
      `SELECT 
        o.*, 
        p.name as pack_name, 
        p.description as pack_description,
        p.image_url as pack_image,
        p.price as pack_price,
        p.deposit_price as pack_deposit_price,
        p.estimated_resale_value
      FROM orders o 
      JOIN packs p ON o.pack_id = p.id 
      WHERE o.stripe_checkout_session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error fetching order by session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      message: error.message 
    });
  }
});

// GET /api/orders/:id - Get order details by order ID
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbQuery(
      `SELECT 
        o.*, 
        p.name as pack_name, 
        p.description as pack_description,
        p.image_url as pack_image,
        p.price as pack_price,
        p.deposit_price as pack_deposit_price,
        p.estimated_resale_value
      FROM orders o 
      JOIN packs p ON o.pack_id = p.id 
      WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      message: error.message 
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['pending', 'paid', 'deposit_paid', 'shipped', 'completed', 'cancelled']),
  body('notes').optional().isLength({ max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if order exists
    const orderResult = await dbQuery(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    const order = orderResult.rows[0];

    // Update order status
    const updateResult = await dbQuery(
      'UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, notes, id]
    );

    // If order is being marked as paid, reserve inventory
    if (status === 'paid' && order.status !== 'paid') {
      await dbQuery(
        'UPDATE packs SET available_quantity = available_quantity - 1, reserved_quantity = reserved_quantity + 1 WHERE id = $1',
        [order.pack_id]
      );

      // Log inventory action
      await dbQuery(
        'INSERT INTO inventory_log (pack_id, action, quantity, order_id) VALUES ($1, $2, $3, $4)',
        [order.pack_id, 'sell', 1, order.id]
      );
    }

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Order status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Failed to update order status',
      message: error.message 
    });
  }
});

// GET /api/orders - Get orders with filtering (admin only)
router.get('/', [
  // Add admin authentication middleware here
], async (req, res) => {
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

module.exports = router;
