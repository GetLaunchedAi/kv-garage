/**
 * Payment Routes
 * Handles Stripe payment processing and webhook events
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fileManager = require('../utils/file-manager');
const ActivityLogger = require('../utils/activity-logger');
const winston = require('winston');

/**
 * POST /api/payments/create-intent
 * Create a payment intent for a pack purchase
 */
router.post('/create-intent', async (req, res) => {
  try {
    const { pack_id, customer_email, customer_name, amount } = req.body;
    
    // Validate required fields
    if (!pack_id || !amount || !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pack_id, amount, customer_email'
      });
    }
    
    winston.info(`Creating payment intent for pack ${pack_id}, amount: ${amount}`);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        pack_id: pack_id,
        customer_email: customer_email,
        customer_name: customer_name || 'Unknown'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    winston.info(`Payment intent created: ${paymentIntent.id}`);
    
    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
    
  } catch (error) {
    winston.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment and create order
 */
router.post('/confirm', async (req, res) => {
  try {
    const { payment_intent_id, pack_id, customer_email, customer_name } = req.body;
    
    winston.info(`Confirming payment: ${payment_intent_id}`);
    winston.info(`Looking for pack_id: ${pack_id} (type: ${typeof pack_id})`);
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }
    
    // Get pack details
    const packsData = await fileManager.readJSON('packs.json');
    winston.info(`Available pack IDs: ${packsData.packs.map(p => `${p.id} (${typeof p.id})`).join(', ')}`);
    const pack = packsData.packs.find(p => p.id == pack_id); // Use loose equality to handle string/number mismatch
    
    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    // Create order
    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pack_id: pack_id,
      pack_name: pack.name,
      customer_email: customer_email,
      customer_name: customer_name,
      amount: paymentIntent.amount / 100, // Convert from cents
      payment_intent_id: payment_intent_id,
      payment_status: 'completed',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [{
        status: 'pending',
        changed_at: new Date().toISOString(),
        changed_by: 'system',
        notes: 'Order created after successful payment'
      }]
    };
    
    // Save order to JSON file
    const ordersData = await fileManager.readJSON('orders.json');
    if (!ordersData.orders) {
      ordersData.orders = [];
    }
    ordersData.orders.push(order);
    await fileManager.writeJSON('orders.json', ordersData);
    
    // Log activity
    await ActivityLogger.logOrderActivity(order, 'created', 'system');
    
    winston.info(`Order created: ${order.id} for pack ${pack_id}`);
    
    res.json({
      success: true,
      order: order,
      message: 'Payment confirmed and order created'
    });
    
  } catch (error) {
    winston.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_...'; // You'll need to set this up
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    winston.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      winston.info(`Payment succeeded: ${paymentIntent.id}`);
      
      // Update order status if needed
      try {
        const ordersData = await fileManager.readJSON('orders.json');
        const orderIndex = ordersData.orders.findIndex(order => 
          order.payment_intent_id === paymentIntent.id
        );
        
        if (orderIndex !== -1) {
          ordersData.orders[orderIndex].payment_status = 'completed';
          ordersData.orders[orderIndex].updated_at = new Date().toISOString();
          await fileManager.writeJSON('orders.json', ordersData);
          
          // Log activity
          await ActivityLogger.logOrderActivity(ordersData.orders[orderIndex], 'payment_completed', 'system');
        }
      } catch (error) {
        winston.error('Error updating order after payment success:', error);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      winston.info(`Payment failed: ${failedPayment.id}`);
      
      // Update order status
      try {
        const ordersData = await fileManager.readJSON('orders.json');
        const orderIndex = ordersData.orders.findIndex(order => 
          order.payment_intent_id === failedPayment.id
        );
        
        if (orderIndex !== -1) {
          ordersData.orders[orderIndex].payment_status = 'failed';
          ordersData.orders[orderIndex].status = 'cancelled';
          ordersData.orders[orderIndex].updated_at = new Date().toISOString();
          await fileManager.writeJSON('orders.json', ordersData);
          
          // Log activity
          await ActivityLogger.logOrderActivity(ordersData.orders[orderIndex], 'payment_failed', 'system');
        }
      } catch (error) {
        winston.error('Error updating order after payment failure:', error);
      }
      break;
      
    default:
      winston.info(`Unhandled event type: ${event.type}`);
  }
  
  res.json({received: true});
});

/**
 * POST /api/payments/create-cart-intent
 * Create a payment intent for a cart purchase
 */
router.post('/create-cart-intent', async (req, res) => {
  try {
    const { cart_items, customer_email, customer_name, amount } = req.body;
    
    // Validate required fields
    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0 || !amount || !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cart_items, amount, customer_email'
      });
    }
    
    winston.info(`Creating cart payment intent for ${cart_items.length} items, amount: ${amount}`);
    
    // Create payment intent with limited metadata (Stripe has 500 char limit per metadata value)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        customer_email: customer_email,
        customer_name: customer_name || 'Unknown',
        purchase_type: 'cart',
        item_count: cart_items.length.toString(),
        total_amount: amount.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    winston.info(`Cart payment intent created: ${paymentIntent.id}`);
    
    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
    
  } catch (error) {
    winston.error('Cart payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cart payment intent'
    });
  }
});

/**
 * POST /api/payments/confirm-cart
 * Confirm a cart payment and create order
 */
router.post('/confirm-cart', async (req, res) => {
  try {
    const { payment_intent_id, cart_items, customer_email, customer_name } = req.body;
    
    winston.info(`Confirming cart payment: ${payment_intent_id}`);
    
    // Validate required fields
    if (!payment_intent_id || !cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: payment_intent_id, cart_items'
      });
    }
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }
    
    // Calculate total amount
    const totalAmount = cart_items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Create order with cart items
    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: cart_items,
      customer_email: customer_email,
      customer_name: customer_name,
      amount: totalAmount,
      payment_intent_id: payment_intent_id,
      payment_status: 'completed',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [{
        status: 'pending',
        changed_at: new Date().toISOString(),
        changed_by: 'system',
        notes: 'Cart order created after successful payment'
      }]
    };
    
    // Save order to JSON file
    const ordersData = await fileManager.readJSON('orders.json');
    if (!ordersData.orders) {
      ordersData.orders = [];
    }
    ordersData.orders.push(order);
    await fileManager.writeJSON('orders.json', ordersData);
    
    // Log activity
    await ActivityLogger.logOrderActivity(order, 'order_created', 'system');
    
    winston.info(`Cart order created: ${order.id}`);
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    winston.error('Cart payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm cart payment'
    });
  }
});

/**
 * GET /api/payments/config
 * Get Stripe configuration for frontend
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;
