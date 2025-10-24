/**
 * KV Garage Admin API Server
 * Handles admin authentication, manifest uploads, and data management
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'logs/api.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manifests', require('./routes/manifests'));
app.use('/api/packs', require('./routes/packs'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/custom-requests', require('./routes/custom-requests'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('API Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`KV Garage API Server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
