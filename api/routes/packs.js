/**
 * Pack Management Routes
 * Handles CRUD operations for packs
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const GitDatabase = require('../utils/git-database');
const winston = require('winston');

// Initialize Git database
const gitDb = new GitDatabase();

/**
 * GET /api/packs
 * Get all packs
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query;
    
    winston.info('Fetching packs from Git database');
    
    const packs = await gitDb.getPacks();
    
    // Apply filters
    let filteredPacks = packs;
    if (category) {
      filteredPacks = filteredPacks.filter(pack => 
        pack.category && pack.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (status) {
      filteredPacks = filteredPacks.filter(pack => pack.status === status);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPacks = filteredPacks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      packs: paginatedPacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredPacks.length,
        pages: Math.ceil(filteredPacks.length / limit)
      }
    });
  } catch (error) {
    winston.error('Packs fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load packs from Git database'
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
    
    winston.info(`Fetching pack ${id} from Git database`);
    
    const packs = await gitDb.getPacks();
    const pack = packs.find(p => p.id == id);
    
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
      error: 'Failed to load pack from Git database'
    });
  }
});

/**
 * POST /api/packs
 * Create new pack
 */
router.post('/', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const packData = req.body;
    const userEmail = req.user.email;
    
    // Validate required fields
    if (!packData.name || !packData.description || !packData.price || !packData.type) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, price, and type are required'
      });
    }
    
    winston.info(`Creating new pack: ${packData.name} by ${userEmail}`);
    
    const newPack = await gitDb.createPack(packData, userEmail);
    
    winston.info(`Pack created successfully: ${newPack.id}`);
    
    res.status(201).json({
      success: true,
      pack: newPack,
      message: 'Pack created and committed to Git repository'
    });
  } catch (error) {
    winston.error('Pack creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pack in Git database'
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
    const userEmail = req.user.email;
    
    winston.info(`Updating pack ${id} by ${userEmail}`);
    
    const updatedPack = await gitDb.updatePack(id, updates, userEmail);
    
    winston.info(`Pack updated successfully: ${id}`);
    
    res.json({
      success: true,
      pack: updatedPack,
      message: 'Pack updated and committed to Git repository'
    });
  } catch (error) {
    winston.error('Pack update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pack in Git database'
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
    const userEmail = req.user.email;
    
    winston.info(`Deleting pack ${id} by ${userEmail}`);
    
    const deletedPack = await gitDb.deletePack(id, userEmail);
    
    winston.info(`Pack deleted successfully: ${id}`);
    
    res.json({
      success: true,
      message: 'Pack deleted and committed to Git repository',
      deleted_pack: {
        id: deletedPack.id,
        name: deletedPack.name
      }
    });
  } catch (error) {
    winston.error('Pack deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pack from Git database'
    });
  }
});

/**
 * GET /api/packs/categories
 * Get all pack categories
 */
router.get('/categories', async (req, res) => {
  try {
    const packs = await gitDb.getPacks();
    const categories = [...new Set(packs.map(pack => pack.category).filter(Boolean))];
    
    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    winston.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load categories from Git database'
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
