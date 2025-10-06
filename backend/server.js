const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const packRoutes = require('./routes/packs');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const manifestRoutes = require('./routes/manifests');
const customPackRoutes = require('./routes/customPacks');
const catalogRoutes = require('./routes/catalogs');
const contactRoutes = require('./routes/contact');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/packs', packRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manifests', manifestRoutes);
app.use('/api/custom-packs', customPackRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/contact', contactRoutes);

// Stripe webhook endpoint (must be before body parsing middleware)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), require('./routes/webhooks'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`KV Garage Backend API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
