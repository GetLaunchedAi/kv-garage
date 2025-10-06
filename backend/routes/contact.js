const express = require('express');
const { body, validationResult } = require('express-validator');
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

// POST /api/contact - Handle contact form submissions
router.post('/', [
  body('name').isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10, max: 20 }).withMessage('Phone must be between 10 and 20 characters'),
  body('business').optional().isLength({ max: 255 }).withMessage('Business name must be less than 255 characters'),
  body('subject').isIn(['general', 'pack-info', 'custom-pack', 'order-support', 'partnership', 'other']).withMessage('Valid subject is required'),
  body('message').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
], validateRequest, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      business,
      subject,
      message
    } = req.body;

    // Log the contact form submission
    logger.info('Contact form submission received:', {
      name,
      email,
      phone,
      business,
      subject,
      message: message.substring(0, 100) + '...' // Log first 100 chars only
    });

    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send auto-reply to customer
    // 4. Integrate with CRM system

    // For now, we'll just log and return success
    // TODO: Implement email sending with nodemailer or similar
    // TODO: Save to database for admin tracking
    // TODO: Send auto-reply to customer

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: `contact_${Date.now()}`,
        timestamp: new Date().toISOString(),
        subject: subject
      }
    });

  } catch (error) {
    logger.error('Error processing contact form:', error);
    res.status(500).json({ 
      error: 'Failed to process contact form',
      message: error.message 
    });
  }
});

// GET /api/contact/subjects - Get available contact subjects
router.get('/subjects', (req, res) => {
  const subjects = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'pack-info', label: 'Pack Information' },
    { value: 'custom-pack', label: 'Custom Pack Request' },
    { value: 'order-support', label: 'Order Support' },
    { value: 'partnership', label: 'Partnership Opportunity' },
    { value: 'other', label: 'Other' }
  ];

  res.json({
    success: true,
    data: subjects
  });
});

module.exports = router;
