require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const PDFDocument = require('pdfkit');

// Import mock routes
const packRoutes = require('./routes/packs-mock');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(helmet()); // Add security headers
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger

// API Routes
app.use('/api/packs', packRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running (mock mode)',
    timestamp: new Date().toISOString()
  });
});

// Mock admin endpoints will be defined later in the file

// Mock orders endpoint
app.get('/api/orders', (req, res) => {
  res.status(401).json({
    error: 'Authentication required',
    message: 'Please provide a valid JWT token'
  });
});

// Mock pack details endpoint
app.get('/api/packs/:id', (req, res) => {
  const { id } = req.params;
  
  // Find the pack in our mock data
  const mockPacks = [
    {
      id: '1',
      name: 'Starter Pack',
      slug: 'starter-pack',
      type: 'starter',
      price: 299.99,
      deposit_price: 149.99,
      number_of_units: 250,
      estimated_resale_value: 750.00,
      description: 'Perfect for new resellers looking to get started in the tech liquidation business. This pack contains a curated mix of mobile accessories, cables, and small electronics.',
      short_description: 'Curated mix of mobile accessories and small electronics',
      image_url: '/images/packs/starter-pack.jpg',
      status: 'limited',
      available_quantity: 3,
      reserved_quantity: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Reseller Pack',
      slug: 'reseller-pack',
      type: 'reseller',
      price: 599.99,
      deposit_price: 299.99,
      number_of_units: 500,
      estimated_resale_value: 1500.00,
      description: 'Ideal for established resellers looking to scale their business. This pack includes a diverse mix of consumer electronics, accessories, and trending tech items.',
      short_description: 'Diverse mix of consumer electronics and trending tech',
      image_url: '/images/packs/reseller-pack.jpg',
      status: 'limited',
      available_quantity: 7,
      reserved_quantity: 1,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Pro Pack',
      slug: 'pro-pack',
      type: 'pro',
      price: 999.99,
      deposit_price: 499.99,
      number_of_units: 1000,
      estimated_resale_value: 3000.00,
      description: 'For professional resellers and businesses. This premium pack contains high-value electronics, premium accessories, and exclusive tech items with maximum profit potential.',
      short_description: 'Premium pack with high-value electronics and exclusive items',
      image_url: '/images/packs/pro-pack.jpg',
      status: 'available',
      available_quantity: 12,
      reserved_quantity: 0,
      created_at: new Date().toISOString()
    }
  ];
  
  const pack = mockPacks.find(p => p.id === id);
  
  if (!pack) {
    return res.status(404).json({
      error: 'Pack not found'
    });
  }
  
  // Get manifest for this pack
  const mockManifests = {
    '1': [
      { sku: 'CBL-001', item_name: 'Lightning Cable 6ft', quantity: 50, condition: 'new', notes: 'Original packaging' },
      { sku: 'CBL-002', item_name: 'USB-C Cable 3ft', quantity: 40, condition: 'new', notes: 'Original packaging' },
      { sku: 'ACC-001', item_name: 'Phone Case iPhone 12', quantity: 30, condition: 'new', notes: 'Various colors' },
      { sku: 'ACC-002', item_name: 'Wireless Charger', quantity: 25, condition: 'new', notes: 'Qi compatible' },
      { sku: 'ACC-003', item_name: 'Bluetooth Earbuds', quantity: 20, condition: 'refurbished', notes: 'Tested and working' }
    ],
    '2': [
      { sku: 'TAB-001', item_name: 'iPad Air 4th Gen', quantity: 5, condition: 'refurbished', notes: 'Excellent condition' },
      { sku: 'LAP-001', item_name: 'MacBook Air M1', quantity: 3, condition: 'refurbished', notes: '8GB RAM, 256GB SSD' },
      { sku: 'PHN-001', item_name: 'iPhone 12 Pro', quantity: 8, condition: 'refurbished', notes: '128GB, various colors' },
      { sku: 'ACC-006', item_name: 'Magic Mouse', quantity: 12, condition: 'new', notes: 'Original packaging' }
    ],
    '3': [
      { sku: 'LAP-002', item_name: 'MacBook Pro 16" M1 Max', quantity: 2, condition: 'refurbished', notes: '32GB RAM, 1TB SSD' },
      { sku: 'TAB-002', item_name: 'iPad Pro 12.9" M1', quantity: 3, condition: 'refurbished', notes: '256GB, WiFi + Cellular' },
      { sku: 'PHN-002', item_name: 'iPhone 13 Pro Max', quantity: 5, condition: 'refurbished', notes: '256GB, various colors' },
      { sku: 'WAT-001', item_name: 'Apple Watch Series 7', quantity: 8, condition: 'refurbished', notes: 'GPS + Cellular' }
    ]
  };
  
  const manifest = mockManifests[id] || [];
  
  res.json({
    success: true,
    data: {
      pack,
      manifest
    }
  });
});

// Mock manifests endpoint
app.get('/api/manifests/:id', (req, res) => {
  const { id } = req.params;
  
  const mockManifests = {
    '1': [
      { sku: 'CBL-001', item_name: 'Lightning Cable 6ft', quantity: 50, condition: 'new', notes: 'Original packaging' },
      { sku: 'CBL-002', item_name: 'USB-C Cable 3ft', quantity: 40, condition: 'new', notes: 'Original packaging' },
      { sku: 'ACC-001', item_name: 'Phone Case iPhone 12', quantity: 30, condition: 'new', notes: 'Various colors' },
      { sku: 'ACC-002', item_name: 'Wireless Charger', quantity: 25, condition: 'new', notes: 'Qi compatible' },
      { sku: 'ACC-003', item_name: 'Bluetooth Earbuds', quantity: 20, condition: 'refurbished', notes: 'Tested and working' }
    ],
    '2': [
      { sku: 'TAB-001', item_name: 'iPad Air 4th Gen', quantity: 5, condition: 'refurbished', notes: 'Excellent condition' },
      { sku: 'LAP-001', item_name: 'MacBook Air M1', quantity: 3, condition: 'refurbished', notes: '8GB RAM, 256GB SSD' },
      { sku: 'PHN-001', item_name: 'iPhone 12 Pro', quantity: 8, condition: 'refurbished', notes: '128GB, various colors' },
      { sku: 'ACC-006', item_name: 'Magic Mouse', quantity: 12, condition: 'new', notes: 'Original packaging' }
    ],
    '3': [
      { sku: 'LAP-002', item_name: 'MacBook Pro 16" M1 Max', quantity: 2, condition: 'refurbished', notes: '32GB RAM, 1TB SSD' },
      { sku: 'TAB-002', item_name: 'iPad Pro 12.9" M1', quantity: 3, condition: 'refurbished', notes: '256GB, WiFi + Cellular' },
      { sku: 'PHN-002', item_name: 'iPhone 13 Pro Max', quantity: 5, condition: 'refurbished', notes: '256GB, various colors' },
      { sku: 'WAT-001', item_name: 'Apple Watch Series 7', quantity: 8, condition: 'refurbished', notes: 'GPS + Cellular' }
    ]
  };
  
  const manifest = mockManifests[id] || [];
  
  res.json({
    success: true,
    data: manifest
  });
});

// Mock checkout endpoint
app.post('/api/orders/create-checkout-session', (req, res) => {
  const { packId, mode } = req.body;
  
  if (!packId || !mode) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'packId and mode are required'
    });
  }
  
  // Mock Stripe checkout session
  const mockSessionUrl = `https://checkout.stripe.com/mock-session-${packId}-${mode}`;
  
  res.json({
    success: true,
    sessionUrl: mockSessionUrl,
    sessionId: `cs_mock_${Date.now()}`,
    orderId: `order_${Date.now()}`,
    message: 'Checkout session created successfully (mock mode)'
  });
});

// Mock catalogs endpoint
app.get('/api/catalogs/hero', (req, res) => {
  try {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'KV Garage Hero Catalog',
        Author: 'KV Garage',
        Subject: 'Wholesale Tech Packs for Resellers',
        Keywords: 'wholesale, tech, reseller, liquidation, mobile accessories'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="kv-garage-hero-catalog.pdf"');

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('KV GARAGE', 50, 50, { align: 'center' });

    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#374151')
       .text('Wholesale Tech Packs for Resellers', 50, 80, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#6b7280')
       .text('Curated wholesale tech packs with detailed manifests • Perfect for resellers', 50, 105, { align: 'center' });

    // Add contact information
    doc.fontSize(10)
       .fillColor('#374151')
       .text('Phone: (616) 228-2244', 50, 140)
       .text('Email: support@kvgarage.com', 50, 155);

    let yPosition = 200;

    // Mock pack data
    const mockPacks = [
      {
        name: 'Starter Pack',
        price: 299.99,
        deposit_price: 149.99,
        number_of_units: 250,
        estimated_resale_value: 750.00,
        description: 'Perfect for new resellers looking to get started in the tech liquidation business. This pack contains a curated mix of mobile accessories, cables, and small electronics.'
      },
      {
        name: 'Reseller Pack',
        price: 599.99,
        deposit_price: 299.99,
        number_of_units: 500,
        estimated_resale_value: 1500.00,
        description: 'Ideal for established resellers looking to scale their business. This pack includes a diverse mix of consumer electronics, accessories, and trending tech items.'
      },
      {
        name: 'Pro Pack',
        price: 999.99,
        deposit_price: 499.99,
        number_of_units: 1000,
        estimated_resale_value: 3000.00,
        description: 'For professional resellers and businesses. This premium pack contains high-value electronics, premium accessories, and exclusive tech items with maximum profit potential.'
      }
    ];

    // Add packs
    mockPacks.forEach((pack, index) => {
      // Check if we need a new page
      if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
      }

      // Pack title
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text(pack.name.toUpperCase(), 50, yPosition);

      yPosition += 25;

      // Pack details
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#374151')
         .text(`Price: $${pack.price.toFixed(2)}`, 50, yPosition)
         .text(`Units: ${pack.number_of_units}`, 200, yPosition)
         .text(`Est. Resale: $${pack.estimated_resale_value.toFixed(2)}`, 350, yPosition);

      yPosition += 20;

      // Description
      doc.fontSize(10)
         .text(pack.description, 50, yPosition, { width: 500 });

      yPosition += 30;

      // Payment options
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Payment Options:', 50, yPosition);
      
      yPosition += 15;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• Full Payment: $${pack.price.toFixed(2)}`, 70, yPosition);
      
      yPosition += 15;
      
      if (pack.deposit_price) {
        doc.text(`• 50% Deposit: $${pack.deposit_price.toFixed(2)} (Reserve your pack)`, 70, yPosition);
        yPosition += 15;
      }

      yPosition += 20;

      // Add separator line
      doc.strokeColor('#e5e7eb')
         .lineWidth(1)
         .moveTo(50, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      yPosition += 20;
    });

    // Add footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('KV Garage - Wholesale Tech Packs for Resellers', 50, 750, { align: 'center' });
      
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, 765, { align: 'center' });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating hero catalog PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate hero catalog',
      message: error.message 
    });
  }
});

// Mock admin authentication endpoints
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock admin credentials
  const mockAdmin = {
    email: 'admin@kvgarage.com',
    password: 'admin123' // In production, this would be hashed
  };
  
  if (email === mockAdmin.email && password === mockAdmin.password) {
    // Mock JWT token
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    res.json({
      success: true,
      token: mockToken,
      user: {
        id: 1,
        email: mockAdmin.email,
        name: 'Admin User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Mock admin dashboard endpoint
app.get('/api/admin/dashboard', (req, res) => {
  // Mock dashboard data (no auth required in mock mode)
  res.json({
    success: true,
    data: {
      totalPacks: 3,
      totalOrders: 15,
      totalRevenue: 12500.00,
      pendingOrders: 3,
      recentActivity: [
        {
          id: 1,
          type: 'order',
          message: 'New order for Starter Pack',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'custom_request',
          message: 'Custom pack request submitted',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    }
  });
});

// Mock custom pack requests endpoint
app.get('/api/custom-packs/requests', (req, res) => {
  // Mock custom pack requests
  res.json({
    success: true,
    data: [
      {
        id: 1,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        business_name: 'Tech Reseller Co',
        request_description: 'Looking for iPhone accessories and cables',
        estimated_budget: 500.00,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        business_name: 'Mobile Accessories Inc',
        request_description: 'Need gaming accessories and phone cases',
        estimated_budget: 750.00,
        status: 'reviewed',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });
});

// Mock custom pack request submission
app.post('/api/custom-packs/request', (req, res) => {
  const requestData = req.body;
  
  // Mock successful submission
  res.status(201).json({
    success: true,
    data: {
      id: Date.now(),
      ...requestData,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    message: 'Custom pack request submitted successfully. We will contact you within 24 hours.'
  });
});

// Mock admin pack creation endpoint
app.post('/api/admin/packs', (req, res) => {
  const packData = req.body;
  
  // Mock pack creation
  const newPack = {
    id: Date.now(),
    name: packData.name,
    type: packData.type,
    price: parseFloat(packData.price),
    deposit_price: packData.deposit_price ? parseFloat(packData.deposit_price) : null,
    number_of_units: parseInt(packData.number_of_units),
    estimated_resale_value: parseFloat(packData.estimated_resale_value),
    description: packData.description || '',
    image_url: packData.image_url || '/images/packs/default-pack.jpg',
    status: packData.status || 'available',
    available_quantity: parseInt(packData.number_of_units),
    reserved_quantity: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: newPack,
    message: 'Pack created successfully'
  });
});

// Mock admin pack update endpoint
app.put('/api/admin/packs/:id', (req, res) => {
  const { id } = req.params;
  const packData = req.body;
  
  // Mock pack update
  const updatedPack = {
    id: parseInt(id),
    name: packData.name,
    type: packData.type,
    price: parseFloat(packData.price),
    deposit_price: packData.deposit_price ? parseFloat(packData.deposit_price) : null,
    number_of_units: parseInt(packData.number_of_units),
    estimated_resale_value: parseFloat(packData.estimated_resale_value),
    description: packData.description || '',
    image_url: packData.image_url || '/images/packs/default-pack.jpg',
    status: packData.status || 'available',
    available_quantity: parseInt(packData.number_of_units),
    reserved_quantity: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: updatedPack,
    message: 'Pack updated successfully'
  });
});

// Mock admin analytics endpoint
app.get('/api/admin/analytics', (req, res) => {
  const { period = '7' } = req.query;
  
  // Mock analytics data
  res.json({
    success: true,
    data: {
      period: `${period} days`,
      totalRevenue: 12500.00,
      totalOrders: 15,
      averageOrderValue: 833.33,
      topSellingPacks: [
        { name: 'Starter Pack', sales: 8, revenue: 2399.92 },
        { name: 'Reseller Pack', sales: 5, revenue: 2999.95 },
        { name: 'Pro Pack', sales: 2, revenue: 1999.98 }
      ],
      revenueByDay: [
        { date: '2024-01-01', revenue: 1200.00 },
        { date: '2024-01-02', revenue: 800.00 },
        { date: '2024-01-03', revenue: 1500.00 }
      ]
    }
  });
});

// Mock individual pack catalog endpoint
app.get('/api/catalogs/pack/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock pack data
    const mockPacks = {
      '1': {
        name: 'Starter Pack',
        price: 299.99,
        deposit_price: 149.99,
        number_of_units: 250,
        estimated_resale_value: 750.00,
        description: 'Perfect for new resellers looking to get started in the tech liquidation business. This pack contains a curated mix of mobile accessories, cables, and small electronics.'
      },
      '2': {
        name: 'Reseller Pack',
        price: 599.99,
        deposit_price: 299.99,
        number_of_units: 500,
        estimated_resale_value: 1500.00,
        description: 'Ideal for established resellers looking to scale their business. This pack includes a diverse mix of consumer electronics, accessories, and trending tech items.'
      },
      '3': {
        name: 'Pro Pack',
        price: 999.99,
        deposit_price: 499.99,
        number_of_units: 1000,
        estimated_resale_value: 3000.00,
        description: 'For professional resellers and businesses. This premium pack contains high-value electronics, premium accessories, and exclusive tech items with maximum profit potential.'
      }
    };
    
    const pack = mockPacks[id];
    
    if (!pack) {
      return res.status(404).json({
        error: 'Pack not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `${pack.name} - Pack Catalog`,
        Author: 'KV Garage',
        Subject: 'Wholesale Tech Pack Details',
        Keywords: 'wholesale, tech, reseller, pack, manifest'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pack.name.toLowerCase().replace(/\s+/g, '-')}-catalog.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text(pack.name.toUpperCase(), 50, 50, { align: 'center' });

    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#374151')
       .text('Wholesale Tech Pack Details', 50, 80, { align: 'center' });

    let yPosition = 120;

    // Pack overview
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Pack Overview', 50, yPosition);

    yPosition += 25;

    const overview = [
      `Pack Name: ${pack.name}`,
      `Price: $${pack.price.toFixed(2)}`,
      `50% Deposit: $${pack.deposit_price.toFixed(2)}`,
      `Units: ${pack.number_of_units}`,
      `Estimated Resale Value: $${pack.estimated_resale_value.toFixed(2)}`,
      `Description: ${pack.description}`
    ];

    overview.forEach(item => {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#374151')
         .text(item, 50, yPosition);
      yPosition += 18;
    });

    yPosition += 20;

    // Payment options
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Payment Options', 50, yPosition);

    yPosition += 25;

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`• Full Payment: $${pack.price.toFixed(2)}`, 50, yPosition);
    
    yPosition += 18;
    
    if (pack.deposit_price) {
      doc.text(`• 50% Deposit: $${pack.deposit_price.toFixed(2)} (Reserve your pack)`, 50, yPosition);
      doc.text(`• Remaining Balance: $${(pack.price - pack.deposit_price).toFixed(2)}`, 50, yPosition + 18);
      yPosition += 36;
    }

    yPosition += 30;

    // Contact information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Contact Information', 50, yPosition);

    yPosition += 25;

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#374151')
       .text('Phone: (616) 228-2244', 50, yPosition);
    
    yPosition += 18;
    
    doc.text('Email: support@kvgarage.com', 50, yPosition);

    // Add footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('KV Garage - Wholesale Tech Packs for Resellers', 50, 750, { align: 'center' });
      
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, 765, { align: 'center' });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating pack catalog PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate pack catalog',
      message: error.message 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Packs API: http://localhost:${PORT}/api/packs`);
  console.log(`🔧 Mock mode - No database required`);
});
