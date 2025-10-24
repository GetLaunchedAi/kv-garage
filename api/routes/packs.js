/**
 * Pack Management Routes
 * Handles CRUD operations for packs
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const fileManager = require('../utils/file-manager');
const ActivityLogger = require('../utils/activity-logger');
const winston = require('winston');

/**
 * GET /api/packs
 * Get all packs
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query;
    
    winston.info('Fetching packs');
    
    const packsData = await fileManager.readJSON('packs.json');
    let packs = packsData.packs || [];
    
    // Apply filters
    if (category) {
      packs = packs.filter(pack => 
        pack.category && pack.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (status) {
      packs = packs.filter(pack => 
        pack.status === status
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPacks = packs.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      packs: paginatedPacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: packs.length,
        pages: Math.ceil(packs.length / limit)
      }
    });
  } catch (error) {
    winston.error('Packs fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load packs'
    });
  }
});

/**
 * GET /api/packs/:id
 * Get specific pack by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Fetching pack ${id}`);
    
    const packsData = await fileManager.readJSON('packs.json');
    const pack = packsData.packs.find(p => p.id == id);
    
    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    res.json({
      success: true,
      pack
    });
  } catch (error) {
    winston.error('Pack fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load pack'
    });
  }
});

/**
 * POST /api/packs
 * Create new pack
 */
router.post('/', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      type,
      deposit_price,
      estimated_resale_value,
      number_of_units,
      available_quantity,
      reserved_quantity,
      short_description,
      image_url,
      status = 'available' 
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, price, and type are required'
      });
    }
    
    winston.info(`Creating new pack: ${name}`);
    
    const packsData = await fileManager.readJSON('packs.json');
    
    // Generate unique ID
    const newPack = {
      id: Date.now().toString(),
      name: name.trim(),
      type: type.trim(),
      description: description.trim(),
      short_description: short_description?.trim() || '',
      price: parseFloat(price),
      deposit_price: parseFloat(deposit_price) || 0,
      estimated_resale_value: estimated_resale_value || '',
      number_of_units: parseInt(number_of_units) || 0,
      available_quantity: parseInt(available_quantity) || 0,
      reserved_quantity: parseInt(reserved_quantity) || 0,
      image_url: image_url?.trim() || '',
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.email
    };
    
    // Validate pack data
    if (isNaN(newPack.price) || newPack.price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number'
      });
    }
    
    if (isNaN(newPack.deposit_price) || newPack.deposit_price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Deposit price must be a positive number'
      });
    }
    
    if (isNaN(newPack.number_of_units) || newPack.number_of_units < 0) {
      return res.status(400).json({
        success: false,
        error: 'Number of units must be a positive number'
      });
    }
    
    if (isNaN(newPack.available_quantity) || newPack.available_quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Available quantity must be a positive number'
      });
    }
    
    packsData.packs.push(newPack);
    await fileManager.writeJSON('packs.json', packsData);
    
    // Log activity
    await ActivityLogger.logPackActivity(newPack, 'created', req.user.email);
    
    winston.info(`Pack created successfully: ${newPack.id}`);
    
    res.status(201).json({
      success: true,
      pack: newPack,
      message: 'Pack created successfully'
    });
  } catch (error) {
    winston.error('Pack creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pack'
    });
  }
});

/**
 * PUT /api/packs/:id
 * Update existing pack
 */
router.put('/:id', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    winston.info(`Updating pack ${id}`);
    
    const packsData = await fileManager.readJSON('packs.json');
    const packIndex = packsData.packs.findIndex(pack => pack.id == id);
    
    if (packIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    // Validate price if provided
    if (updates.price !== undefined) {
      const price = parseFloat(updates.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a positive number'
        });
      }
      updates.price = price;
    }
    
    // Update pack with new data
    packsData.packs[packIndex] = {
      ...packsData.packs[packIndex],
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    await fileManager.writeJSON('packs.json', packsData);
    
    // Log activity
    await ActivityLogger.logPackActivity(packsData.packs[packIndex], 'updated', req.user.email);
    
    winston.info(`Pack updated successfully: ${id}`);
    
    res.json({
      success: true,
      pack: packsData.packs[packIndex],
      message: 'Pack updated successfully'
    });
  } catch (error) {
    winston.error('Pack update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pack'
    });
  }
});

/**
 * DELETE /api/packs/:id
 * Delete pack
 */
router.delete('/:id', authenticateToken, requirePermission('delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Deleting pack ${id}`);
    
    const packsData = await fileManager.readJSON('packs.json');
    const packIndex = packsData.packs.findIndex(pack => pack.id == id);
    
    if (packIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    const deletedPack = packsData.packs[packIndex];
    packsData.packs.splice(packIndex, 1);
    
    await fileManager.writeJSON('packs.json', packsData);
    
    winston.info(`Pack deleted successfully: ${id}`);
    
    res.json({
      success: true,
      message: 'Pack deleted successfully',
      deleted_pack: {
        id: deletedPack.id,
        name: deletedPack.name
      }
    });
  } catch (error) {
    winston.error('Pack deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pack'
    });
  }
});

/**
 * GET /api/packs/categories
 * Get all pack categories
 */
router.get('/categories', async (req, res) => {
  try {
    const packsData = await fileManager.readJSON('packs.json');
    const categories = [...new Set(packsData.packs.map(pack => pack.category).filter(Boolean))];
    
    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    winston.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load categories'
    });
  }
});

/**
 * POST /api/packs/:id/duplicate
 * Duplicate existing pack
 */
router.post('/:id/duplicate', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { id } = req.params;
    
    winston.info(`Duplicating pack ${id}`);
    
    const packsData = await fileManager.readJSON('packs.json');
    const originalPack = packsData.packs.find(pack => pack.id === id);
    
    if (!originalPack) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    // Create duplicate with new ID
    const duplicatedPack = {
      ...originalPack,
      id: Date.now().toString(),
      name: `${originalPack.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.email
    };
    
    packsData.packs.push(duplicatedPack);
    await fileManager.writeJSON('packs.json', packsData);
    
    winston.info(`Pack duplicated successfully: ${duplicatedPack.id}`);
    
    res.status(201).json({
      success: true,
      pack: duplicatedPack,
      message: 'Pack duplicated successfully'
    });
  } catch (error) {
    winston.error('Pack duplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate pack'
    });
  }
});

module.exports = router;
