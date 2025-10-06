# Technical Requirements Document
## KV Garage Wholesale Platform

---

## 1. System Architecture Overview

### Current Technology Stack
- **Frontend**: Eleventy.js (Static Site Generator)
- **Styling**: CSS with custom properties and responsive design
- **JavaScript**: Vanilla JS with modern ES6+ features
- **E-commerce**: Snipcart integration
- **Hosting**: Static site hosting (Netlify/Vercel compatible)
- **Images**: WebP format with fallbacks

### Proposed Technology Stack
- **Frontend**: Eleventy.js (maintain current benefits)
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL or MySQL
- **Payments**: Stripe Checkout integration
- **File Generation**: PDF-lib for manifests, CSV generation
- **Real-time**: WebSocket or Server-Sent Events
- **Admin Panel**: Custom React/Vue.js or server-rendered

---

## 2. Database Schema Design

### Core Tables

#### Packs Table
```sql
CREATE TABLE packs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type ENUM('starter', 'reseller', 'pro') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  deposit_price DECIMAL(10,2) NOT NULL,
  units INT NOT NULL,
  resale_estimate DECIMAL(10,2),
  description TEXT,
  short_description VARCHAR(500),
  image VARCHAR(500),
  status ENUM('active', 'inactive', 'sold_out') DEFAULT 'active',
  available_quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Manifests Table
```sql
CREATE TABLE manifests (
  id SERIAL PRIMARY KEY,
  pack_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  condition_grade ENUM('A', 'B', 'C') DEFAULT 'A',
  description TEXT,
  image VARCHAR(500),
  estimated_value DECIMAL(8,2),
  category VARCHAR(100),
  brand VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  pack_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  business_name VARCHAR(255),
  business_address TEXT,
  payment_type ENUM('full', 'deposit') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending', 'paid', 'deposit_paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pack_id) REFERENCES packs(id)
);
```

#### Inventory Tracking Table
```sql
CREATE TABLE inventory_log (
  id SERIAL PRIMARY KEY,
  pack_id INT NOT NULL,
  action ENUM('reserve', 'release', 'sell', 'restock') NOT NULL,
  quantity INT NOT NULL,
  order_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pack_id) REFERENCES packs(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 3. API Endpoints Specification

### Pack Management Endpoints
```
GET /api/packs
- Returns list of all active packs
- Query params: type, status, limit, offset
- Response: Array of pack objects with basic info

GET /api/packs/:id
- Returns detailed pack information
- Includes manifest data
- Response: Pack object with full details

GET /api/packs/:id/manifest
- Returns manifest for specific pack
- Query params: format (json, csv, pdf)
- Response: Manifest data in requested format

GET /api/packs/:id/inventory
- Returns real-time inventory status
- Response: Available quantity, reserved quantity
```

### Order Management Endpoints
```
POST /api/orders
- Creates new order
- Body: Customer info, pack_id, payment_type
- Response: Order object with order_number

POST /api/checkout
- Initializes Stripe checkout session
- Body: order_id, payment_type
- Response: Stripe checkout URL

GET /api/orders/:id
- Returns order details
- Response: Order object with status

PUT /api/orders/:id/status
- Updates order status
- Body: status, notes
- Response: Updated order object
```

### Admin Endpoints
```
POST /api/admin/packs
- Creates new pack
- Body: Pack data with manifest
- Response: Created pack object

PUT /api/admin/packs/:id
- Updates pack information
- Body: Updated pack data
- Response: Updated pack object

POST /api/admin/manifests/upload
- Uploads manifest CSV
- Body: CSV file, pack_id
- Response: Processing status

GET /api/admin/orders
- Returns all orders with filtering
- Query params: status, date_range, limit
- Response: Array of order objects

GET /api/admin/analytics
- Returns sales and inventory analytics
- Response: Analytics data object
```

---

## 4. Stripe Integration Requirements

### Payment Flow Design
```javascript
// Full Payment Flow
const fullPaymentFlow = {
  1: 'Create order with payment_type: "full"',
  2: 'Initialize Stripe checkout session',
  3: 'Redirect to Stripe checkout',
  4: 'Handle successful payment webhook',
  5: 'Update order status to "paid"',
  6: 'Reserve inventory',
  7: 'Send confirmation email with manifest'
};

// Deposit Payment Flow
const depositPaymentFlow = {
  1: 'Create order with payment_type: "deposit"',
  2: 'Initialize Stripe checkout session for deposit amount',
  3: 'Redirect to Stripe checkout',
  4: 'Handle successful payment webhook',
  5: 'Update order status to "deposit_paid"',
  6: 'Reserve inventory',
  7: 'Send confirmation email with deposit receipt',
  8: 'Later: Create second checkout for remaining amount',
  9: 'Handle final payment and update to "paid"'
};
```

### Stripe Webhook Handlers
```javascript
// Required webhook events
const webhookEvents = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
];

// Webhook processing
const processWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    // ... other handlers
  }
};
```

---

## 5. File Generation Requirements

### PDF Manifest Generation
```javascript
// Using PDF-lib for manifest generation
const generateManifestPDF = async (packId) => {
  const pack = await getPackWithManifest(packId);
  const pdfDoc = await PDFDocument.create();
  
  // Add header with pack info
  const page = pdfDoc.addPage();
  page.drawText(`Manifest: ${pack.name}`, {
    x: 50,
    y: page.getHeight() - 50,
    size: 24
  });
  
  // Add manifest table
  let yPosition = page.getHeight() - 100;
  pack.manifest.forEach(item => {
    page.drawText(`${item.quantity}x ${item.product_name}`, {
      x: 50,
      y: yPosition,
      size: 12
    });
    yPosition -= 20;
  });
  
  return await pdfDoc.save();
};
```

### CSV Manifest Generation
```javascript
// CSV generation for manifests
const generateManifestCSV = (manifest) => {
  const headers = ['SKU', 'Product Name', 'Quantity', 'Condition', 'Est. Value'];
  const rows = manifest.map(item => [
    item.sku,
    item.product_name,
    item.quantity,
    item.condition_grade,
    item.estimated_value
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
};
```

---

## 6. Real-Time Inventory Management

### Inventory Tracking System
```javascript
// Atomic inventory operations
const reserveInventory = async (packId, quantity, orderId) => {
  const transaction = await db.beginTransaction();
  
  try {
    // Check available inventory
    const pack = await db.query(
      'SELECT available_quantity FROM packs WHERE id = ? FOR UPDATE',
      [packId]
    );
    
    if (pack.available_quantity < quantity) {
      throw new Error('Insufficient inventory');
    }
    
    // Reserve inventory
    await db.query(
      'UPDATE packs SET available_quantity = available_quantity - ?, reserved_quantity = reserved_quantity + ? WHERE id = ?',
      [quantity, quantity, packId]
    );
    
    // Log inventory action
    await db.query(
      'INSERT INTO inventory_log (pack_id, action, quantity, order_id) VALUES (?, ?, ?, ?)',
      [packId, 'reserve', quantity, orderId]
    );
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### Real-Time Updates
```javascript
// WebSocket connection for real-time updates
const setupInventoryUpdates = (io) => {
  io.on('connection', (socket) => {
    socket.on('subscribe-pack', (packId) => {
      socket.join(`pack-${packId}`);
    });
    
    socket.on('unsubscribe-pack', (packId) => {
      socket.leave(`pack-${packId}`);
    });
  });
};

// Broadcast inventory updates
const broadcastInventoryUpdate = (packId, newQuantity) => {
  io.to(`pack-${packId}`).emit('inventory-update', {
    packId,
    availableQuantity: newQuantity
  });
};
```

---

## 7. Security Requirements

### Data Protection
- **HTTPS**: All communications encrypted
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Escape output data
- **CSRF Protection**: Token-based protection for forms

### Payment Security
- **PCI Compliance**: Use Stripe for payment processing
- **Webhook Verification**: Verify Stripe webhook signatures
- **Secure Storage**: Encrypt sensitive customer data
- **Access Control**: Role-based admin access

### API Security
```javascript
// JWT-based authentication for admin endpoints
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 8. Performance Requirements

### Frontend Performance
- **Page Load Time**: < 3 seconds on 3G connection
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1

### Backend Performance
- **API Response Time**: < 200ms for most endpoints
- **Database Queries**: Optimized with proper indexing
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets served from CDN

### Optimization Strategies
```javascript
// Database indexing
CREATE INDEX idx_packs_status ON packs(status);
CREATE INDEX idx_packs_type ON packs(type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

// Caching strategy
const cacheConfig = {
  packs: {
    ttl: 300, // 5 minutes
    key: 'packs:all'
  },
  manifest: {
    ttl: 600, // 10 minutes
    key: 'manifest:pack:{id}'
  },
  inventory: {
    ttl: 30, // 30 seconds
    key: 'inventory:pack:{id}'
  }
};
```

---

## 9. Monitoring and Analytics

### Application Monitoring
- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: New Relic or DataDog
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Log Aggregation**: Winston with centralized logging

### Business Analytics
```javascript
// Analytics tracking
const trackEvent = (event, data) => {
  // Track pack views, manifest downloads, checkout starts
  analytics.track({
    event,
    properties: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
};

// Key metrics to track
const keyMetrics = [
  'pack_views',
  'manifest_downloads',
  'checkout_started',
  'checkout_completed',
  'deposit_payments',
  'full_payments',
  'customer_acquisition'
];
```

---

## 10. Deployment and Infrastructure

### Development Environment
- **Local Development**: Docker containers for consistency
- **Database**: Local PostgreSQL instance
- **Environment Variables**: .env files for configuration
- **Hot Reloading**: Nodemon for backend, Eleventy watch for frontend

### Production Environment
- **Frontend**: Static site deployment (Netlify/Vercel)
- **Backend**: Node.js server (DigitalOcean/AWS)
- **Database**: Managed PostgreSQL (AWS RDS/DigitalOcean)
- **CDN**: CloudFlare for static assets
- **SSL**: Let's Encrypt certificates

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build frontend
        run: npm run build
      - name: Deploy to production
        run: npm run deploy
```

---

## 11. Testing Requirements

### Unit Testing
- **Backend**: Jest for API endpoint testing
- **Frontend**: Jest for utility functions
- **Database**: Integration tests for data operations

### Integration Testing
- **API Testing**: Supertest for endpoint testing
- **Payment Testing**: Stripe test mode integration
- **Database Testing**: Test database with sample data

### End-to-End Testing
- **User Flows**: Playwright for complete user journeys
- **Mobile Testing**: Responsive design validation
- **Cross-Browser**: Chrome, Firefox, Safari testing

---

This technical requirements document provides the foundation for Phase 2 development, ensuring all technical aspects are properly planned and documented.
