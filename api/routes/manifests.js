/**
 * Manifest Management Routes
 * Handles manifest upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const fileManager = require('../utils/file-manager');
const csvParser = require('../utils/csv-parser');
const ActivityLogger = require('../utils/activity-logger');
const winston = require('winston');

// Configure multer for CSV uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

/**
 * POST /api/manifests/upload
 * Upload manifest CSV for a specific pack
 */
router.post('/upload', authenticateToken, requirePermission('upload'), upload.single('manifest'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { pack_id } = req.body;
    const file = req.file;
    
    // Validate input
    if (!pack_id || !file) {
      return res.status(400).json({
        success: false,
        error: 'Pack ID and manifest file are required'
      });
    }

    tempFilePath = file.path;
    winston.info(`Manifest upload started for pack ${pack_id}`);

    // Validate CSV file
    const validation = await csvParser.validateCSVFile(tempFilePath);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Parse CSV file
    const manifestItems = await csvParser.parseManifestCSV(tempFilePath);
    
    // Get statistics
    const stats = csvParser.getStatistics(manifestItems);
    
    // Read current manifests
    const manifestsData = await fileManager.readJSON('manifests.json');
    
    // Update manifests for the specific pack
    manifestsData.manifests[pack_id] = manifestItems;
    
    // Add metadata
    manifestsData.manifests[pack_id + '_metadata'] = {
      uploaded_at: new Date().toISOString(),
      uploaded_by: req.user.email,
      file_size: validation.size,
      items_count: manifestItems.length,
      statistics: stats
    };
    
    // Write updated manifests
    await fileManager.writeJSON('manifests.json', manifestsData);
    
    // Log activity
    await ActivityLogger.logManifestActivity(
      { id: pack_id, name: packData.name || `Pack ${pack_id}` },
      'uploaded',
      req.user.email,
      { items_count: manifestItems.length, file_size: validation.size }
    );
    
    winston.info(`Manifest uploaded successfully for pack ${pack_id}: ${manifestItems.length} items`);
    
    res.json({
      success: true,
      message: `Manifest uploaded successfully for pack ${pack_id}`,
      data: {
        pack_id,
        items_count: manifestItems.length,
        statistics: stats,
        uploaded_at: new Date().toISOString()
      }
    });

  } catch (error) {
    winston.error('Manifest upload error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        winston.info('Temp file cleaned up');
      } catch (cleanupError) {
        winston.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  }
});

/**
 * GET /api/manifests/:pack_id
 * Get manifest for a specific pack
 */
router.get('/:pack_id', async (req, res) => {
  try {
    const { pack_id } = req.params;
    
    winston.info(`Fetching manifest for pack ${pack_id}`);
    
    const manifestsData = await fileManager.readJSON('manifests.json');
    const manifestItems = manifestsData.manifests[pack_id];
    const metadata = manifestsData.manifests[pack_id + '_metadata'];
    
    if (!manifestItems) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found for this pack'
      });
    }
    
    res.json({
      success: true,
      manifest: {
        pack_id,
        items: manifestItems,
        metadata: metadata || null,
        total_items: manifestItems.length,
        total_quantity: manifestItems.reduce((sum, item) => sum + item.quantity, 0),
        total_estimated_value: manifestItems.reduce((sum, item) => sum + (item.estimated_value * item.quantity), 0)
      }
    });
    
  } catch (error) {
    winston.error('Manifest fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load manifest'
    });
  }
});

/**
 * GET /api/manifests
 * Get all manifests
 */
router.get('/', async (req, res) => {
  try {
    const manifestsData = await fileManager.readJSON('manifests.json');
    const manifests = {};
    
    // Filter out metadata entries and return only manifest data
    Object.keys(manifestsData.manifests).forEach(key => {
      if (!key.endsWith('_metadata')) {
        manifests[key] = {
          items: manifestsData.manifests[key],
          metadata: manifestsData.manifests[key + '_metadata'] || null
        };
      }
    });
    
    res.json({
      success: true,
      manifests,
      total_packs: Object.keys(manifests).length
    });
    
  } catch (error) {
    winston.error('Manifests fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load manifests'
    });
  }
});

/**
 * DELETE /api/manifests/:pack_id
 * Delete manifest for a specific pack
 */
router.delete('/:pack_id', authenticateToken, requirePermission('delete'), async (req, res) => {
  try {
    const { pack_id } = req.params;
    
    winston.info(`Deleting manifest for pack ${pack_id}`);
    
    const manifestsData = await fileManager.readJSON('manifests.json');
    
    if (!manifestsData.manifests[pack_id]) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found for this pack'
      });
    }
    
    // Remove manifest and metadata
    delete manifestsData.manifests[pack_id];
    delete manifestsData.manifests[pack_id + '_metadata'];
    
    await fileManager.writeJSON('manifests.json', manifestsData);
    
    winston.info(`Manifest deleted for pack ${pack_id}`);
    
    res.json({
      success: true,
      message: `Manifest deleted successfully for pack ${pack_id}`
    });
    
  } catch (error) {
    winston.error('Manifest deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete manifest'
    });
  }
});

/**
 * GET /api/manifests/template
 * Get CSV template for manifest uploads
 */
router.get('/template', (req, res) => {
  try {
    const template = csvParser.getTemplate();
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    winston.error('Template fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template'
    });
  }
});

/**
 * POST /api/manifests/validate
 * Validate CSV file without uploading
 */
router.post('/validate', upload.single('manifest'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Manifest file is required'
      });
    }

    tempFilePath = file.path;
    
    // Validate CSV file
    const validation = await csvParser.validateCSVFile(tempFilePath);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Parse CSV file
    const manifestItems = await csvParser.parseManifestCSV(tempFilePath);
    const stats = csvParser.getStatistics(manifestItems);
    
    res.json({
      success: true,
      validation: {
        valid: true,
        items_count: manifestItems.length,
        statistics: stats,
        file_size: validation.size
      }
    });

  } catch (error) {
    winston.error('Manifest validation error:', error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        winston.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  }
});

module.exports = router;
