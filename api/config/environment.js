/**
 * Smart Environment Configuration
 * Automatically detects and configures settings for localhost and production
 */

const path = require('path');

// Environment Detection
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = !isProduction;

// Server Configuration
const serverConfig = {
  port: process.env.PORT || 3001,
  host: isLocalhost ? 'localhost' : '0.0.0.0',
  environment: isProduction ? 'production' : 'development'
};

// File System Configuration
const fileSystemConfig = {
  dataDir: isProduction 
    ? '/var/www/html/data'                    // Production (Cloudways)
    : path.join(__dirname, '../public/data'), // Development (localhost)
  
  backupDir: path.join(__dirname, 'backups'),
  uploadDir: path.join(__dirname, 'uploads'),
  logDir: path.join(__dirname, 'logs')
};

// API Configuration
const apiConfig = {
  baseUrl: isLocalhost 
    ? 'http://localhost:3001/api' 
    : '/api',
  
  cors: {
    origin: isLocalhost 
      ? ['http://localhost:8080', 'http://127.0.0.1:8080']
      : ['https://yoursite.com'], // Update with your production domain
    
    credentials: true
  }
};

// Security Configuration
const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || (isProduction 
    ? 'kv-garage-production-secret-key-change-this' 
    : 'kv-garage-dev-secret-key'),
  
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/csv']
  }
};

// Logging Configuration
const loggingConfig = {
  level: isProduction ? 'info' : 'debug',
  file: path.join(__dirname, 'logs', 'api.log'),
  maxSize: '5m',
  maxFiles: 5
};

// Environment Logging
console.log('🌍 Environment Configuration:');
console.log(`   Environment: ${isProduction ? 'production' : 'localhost'}`);
console.log(`   Server: ${serverConfig.host}:${serverConfig.port}`);
console.log(`   Data Directory: ${fileSystemConfig.dataDir}`);
console.log(`   API Base URL: ${apiConfig.baseUrl}`);
console.log(`   JWT Secret: ${securityConfig.jwtSecret.substring(0, 10)}...`);

module.exports = {
  isProduction,
  isLocalhost,
  server: serverConfig,
  files: fileSystemConfig,
  api: apiConfig,
  security: securityConfig,
  logging: loggingConfig
};
