const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

// Mock data for packs
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

// Mock manifest data
const mockManifests = {
  '1': [
    { sku: 'CBL-001', item_name: 'Lightning Cable 6ft', quantity: 50, condition: 'new', notes: 'Original packaging' },
    { sku: 'CBL-002', item_name: 'USB-C Cable 3ft', quantity: 40, condition: 'new', notes: 'Original packaging' },
    { sku: 'ACC-001', item_name: 'Phone Case iPhone 12', quantity: 30, condition: 'new', notes: 'Various colors' },
    { sku: 'ACC-002', item_name: 'Wireless Charger', quantity: 25, condition: 'new', notes: 'Qi compatible' },
    { sku: 'ACC-003', item_name: 'Bluetooth Earbuds', quantity: 20, condition: 'refurbished', notes: 'Tested and working' },
    { sku: 'ACC-004', item_name: 'Phone Stand', quantity: 15, condition: 'new', notes: 'Adjustable angle' },
    { sku: 'ACC-005', item_name: 'Car Mount', quantity: 20, condition: 'new', notes: 'Magnetic mount' }
  ],
  '2': [
    { sku: 'TAB-001', item_name: 'iPad Air 4th Gen', quantity: 5, condition: 'refurbished', notes: 'Excellent condition' },
    { sku: 'LAP-001', item_name: 'MacBook Air M1', quantity: 3, condition: 'refurbished', notes: '8GB RAM, 256GB SSD' },
    { sku: 'PHN-001', item_name: 'iPhone 12 Pro', quantity: 8, condition: 'refurbished', notes: '128GB, various colors' },
    { sku: 'ACC-006', item_name: 'Magic Mouse', quantity: 12, condition: 'new', notes: 'Original packaging' },
    { sku: 'ACC-007', item_name: 'Magic Keyboard', quantity: 10, condition: 'new', notes: 'Original packaging' },
    { sku: 'ACC-008', item_name: 'AirPods Pro', quantity: 15, condition: 'refurbished', notes: 'Tested and working' }
  ],
  '3': [
    { sku: 'LAP-002', item_name: 'MacBook Pro 16" M1 Max', quantity: 2, condition: 'refurbished', notes: '32GB RAM, 1TB SSD' },
    { sku: 'TAB-002', item_name: 'iPad Pro 12.9" M1', quantity: 3, condition: 'refurbished', notes: '256GB, WiFi + Cellular' },
    { sku: 'PHN-002', item_name: 'iPhone 13 Pro Max', quantity: 5, condition: 'refurbished', notes: '256GB, various colors' },
    { sku: 'WAT-001', item_name: 'Apple Watch Series 7', quantity: 8, condition: 'refurbished', notes: 'GPS + Cellular' },
    { sku: 'ACC-009', item_name: 'Studio Display 27"', quantity: 1, condition: 'refurbished', notes: 'Excellent condition' },
    { sku: 'ACC-010', item_name: 'Magic Trackpad', quantity: 6, condition: 'new', notes: 'Original packaging' }
  ]
};

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

// GET /api/packs - Get all active packs
router.get('/', [
  query('type').optional().isIn(['starter', 'reseller', 'pro']),
  query('status').optional().isIn(['active', 'inactive', 'sold_out']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req, res) => {
  try {
    const { type, status, limit = 10, offset = 0 } = req.query;
    
    let filteredPacks = mockPacks;
    
    // Filter by status if provided, otherwise show all available packs
    if (status) {
      filteredPacks = filteredPacks.filter(pack => pack.status === status);
    } else {
      // Show all packs that are not sold out
      filteredPacks = filteredPacks.filter(pack => pack.available_quantity > 0);
    }
    
    if (type) {
      filteredPacks = filteredPacks.filter(pack => pack.type === type);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPacks = filteredPacks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      packs: paginatedPacks,
      data: paginatedPacks, // Keep both for compatibility
      pagination: {
        total: filteredPacks.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredPacks.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching packs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch packs',
      message: error.message 
    });
  }
});

// GET /api/packs/:id - Get pack details
router.get('/:id', [
  param('id').isLength({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pack = mockPacks.find(p => p.id === id);
    
    if (!pack) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    // Get manifest for this pack
    const manifest = mockManifests[id] || [];
    
    res.json({
      success: true,
      data: {
        pack,
        manifest
      }
    });
    
  } catch (error) {
    console.error('Error fetching pack details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pack details',
      message: error.message 
    });
  }
});

// GET /api/packs/:id/inventory - Get pack inventory
router.get('/:id/inventory', [
  param('id').isLength({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pack = mockPacks.find(p => p.id === id);
    
    if (!pack) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        pack_id: id,
        available_quantity: pack.available_quantity,
        reserved_quantity: pack.reserved_quantity,
        total_quantity: pack.number_of_units,
        last_updated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching pack inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pack inventory',
      message: error.message 
    });
  }
});

module.exports = router;
