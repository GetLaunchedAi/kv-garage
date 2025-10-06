const express = require('express');
const { query: dbQuery, transaction } = require('../config/database');
const { logger } = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info('Received Stripe webhook:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutCompleted(session) {
  try {
    const { pack_id, payment_mode } = session.metadata;
    
    logger.info('Processing checkout completion:', { session_id: session.id, pack_id, payment_mode });

    // Find order by session ID
    const orderResult = await dbQuery(
      'SELECT * FROM orders WHERE stripe_checkout_session_id = $1',
      [session.id]
    );

    if (orderResult.rows.length === 0) {
      logger.error('Order not found for session:', session.id);
      return;
    }

    const order = orderResult.rows[0];

    // Update order status based on payment mode
    const newStatus = payment_mode === 'full' ? 'completed' : 'reserved';
    
    await transaction(async (client) => {
      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, stripe_payment_intent_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newStatus, session.payment_intent, order.id]
      );

      // Log inventory action
      await client.query(
        'INSERT INTO inventory_log (pack_id, change_type, quantity_change, new_quantity, reference_id) VALUES ($1, $2, $3, $4, $5)',
        [pack_id, 'order_placed', -1, 0, order.id] // We'll calculate new_quantity properly
      );
    });

    // Send confirmation email
    await sendOrderConfirmationEmail(order.id);

    logger.info('Checkout completed successfully:', { order_id: order.id, status: newStatus });
  } catch (error) {
    logger.error('Error handling checkout completion:', error);
    throw error;
  }
}

// Handle successful payment intent
async function handlePaymentSucceeded(paymentIntent) {
  try {
    logger.info('Payment succeeded:', paymentIntent.id);
    
    // Find order by payment intent ID
    const orderResult = await dbQuery(
      'SELECT * FROM orders WHERE stripe_payment_intent_id = $1',
      [paymentIntent.id]
    );

    if (orderResult.rows.length > 0) {
      const order = orderResult.rows[0];
      
      // Update order status if not already updated
      if (order.status === 'pending') {
        const newStatus = order.payment_type === 'full' ? 'paid' : 'deposit_paid';
        
        await dbQuery(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, order.id]
        );

        logger.info('Order status updated:', { order_id: order.id, status: newStatus });
      }
    }
  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
}

// Handle failed payment intent
async function handlePaymentFailed(paymentIntent) {
  try {
    logger.info('Payment failed:', paymentIntent.id);
    
    // Find order by payment intent ID
    const orderResult = await dbQuery(
      'SELECT * FROM orders WHERE stripe_payment_intent_id = $1',
      [paymentIntent.id]
    );

    if (orderResult.rows.length > 0) {
      const order = orderResult.rows[0];
      
      // Update order status to cancelled
      await dbQuery(
        'UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['cancelled', 'Payment failed', order.id]
      );

      // Release any reserved inventory
      await dbQuery(
        'UPDATE packs SET available_quantity = available_quantity + 1, reserved_quantity = reserved_quantity - 1 WHERE id = $1',
        [order.pack_id]
      );

      // Log inventory action
      await dbQuery(
        'INSERT INTO inventory_log (pack_id, action, quantity, order_id) VALUES ($1, $2, $3, $4)',
        [order.pack_id, 'release', 1, order.id]
      );

      logger.info('Order cancelled due to payment failure:', { order_id: order.id });
    }
  } catch (error) {
    logger.error('Error handling payment failure:', error);
    throw error;
  }
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderId) {
  try {
    // Get order details with pack information
    const orderResult = await dbQuery(
      `SELECT 
        o.*, 
        p.name as pack_name, 
        p.type as pack_type,
        p.description as pack_description
      FROM orders o 
      JOIN packs p ON o.pack_id = p.id 
      WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      logger.error('Order not found for email confirmation:', orderId);
      return;
    }

    const order = orderResult.rows[0];

    // TODO: Implement email sending logic
    // This would typically use nodemailer or similar service
    logger.info('Order confirmation email would be sent:', {
      to: order.customer_email,
      order_number: order.order_number,
      pack_name: order.pack_name
    });

  } catch (error) {
    logger.error('Error sending order confirmation email:', error);
  }
}

module.exports = router;
