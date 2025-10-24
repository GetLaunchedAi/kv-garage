/**
 * File Manager Utility
 * Handles JSON file operations with backup and error recovery
 */

const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

class FileManager {
  constructor() {
    // Smart Environment Detection
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Dynamic path detection based on environment
    if (isProduction) {
      // Production paths (Cloudways)
      this.dataDir = '/var/www/html/data';
      this.backupDir = path.join(__dirname, 'backups');
    } else {
      // Development paths (localhost)
      this.dataDir = path.join(__dirname, '../public/data');
      this.backupDir = path.join(__dirname, 'backups');
    }
    
    // Environment logging
    console.log(`📁 FileManager - Environment: ${isProduction ? 'production' : 'localhost'}`);
    console.log(`📂 Data Directory: ${this.dataDir}`);
    console.log(`💾 Backup Directory: ${this.backupDir}`);
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Read JSON file from data directory
   * @param {string} filename - Name of the JSON file
   * @returns {Object} Parsed JSON data
   */
  async readJSON(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // Return default structure if file doesn't exist
        return this.getDefaultStructure(filename);
      }
      
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      winston.info(`Successfully read ${filename}`);
      return parsed;
    } catch (error) {
      winston.error(`Error reading ${filename}:`, error);
      throw new Error(`Failed to read ${filename}: ${error.message}`);
    }
  }

  /**
   * Write JSON file to data directory with atomic operation
   * @param {string} filename - Name of the JSON file
   * @param {Object} data - Data to write
   * @returns {boolean} Success status
   */
  async writeJSON(filename, data) {
    try {
      // Create backup first
      await this.createBackup(filename);
      
      const filePath = path.join(this.dataDir, filename);
      const jsonData = JSON.stringify(data, null, 2);
      
      // Atomic write: write to temp file, then rename
      const tempPath = filePath + '.tmp';
      await fs.writeFile(tempPath, jsonData, 'utf8');
      await fs.rename(tempPath, filePath);
      
      winston.info(`Successfully wrote ${filename}`);
      return true;
    } catch (error) {
      winston.error(`Error writing ${filename}:`, error);
      
      // Try to restore from backup
      const restored = await this.restoreBackup(filename);
      if (restored) {
        winston.info(`Restored ${filename} from backup`);
      }
      
      throw new Error(`Failed to write ${filename}: ${error.message}`);
    }
  }

  /**
   * Create backup of existing file
   * @param {string} filename - Name of the file to backup
   */
  async createBackup(filename) {
    try {
      const sourcePath = path.join(this.dataDir, filename);
      const backupPath = path.join(this.backupDir, `${filename}.backup`);
      
      // Check if source exists
      try {
        await fs.access(sourcePath);
      } catch {
        return; // File doesn't exist, no backup needed
      }
      
      const data = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(backupPath, data, 'utf8');
      
      winston.info(`Created backup for ${filename}`);
    } catch (error) {
      winston.error(`Backup failed for ${filename}:`, error);
      // Don't throw - backup failure shouldn't stop the operation
    }
  }

  /**
   * Restore file from backup
   * @param {string} filename - Name of the file to restore
   * @returns {boolean} Success status
   */
  async restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, `${filename}.backup`);
      const targetPath = path.join(this.dataDir, filename);
      
      // Check if backup exists
      try {
        await fs.access(backupPath);
      } catch {
        winston.warn(`No backup found for ${filename}`);
        return false;
      }
      
      const data = await fs.readFile(backupPath, 'utf8');
      await fs.writeFile(targetPath, data, 'utf8');
      
      winston.info(`Restored ${filename} from backup`);
      return true;
    } catch (error) {
      winston.error(`Restore failed for ${filename}:`, error);
      return false;
    }
  }

  /**
   * Get default structure for JSON files
   * @param {string} filename - Name of the file
   * @returns {Object} Default structure
   */
  getDefaultStructure(filename) {
    const defaults = {
      'packs.json': {
        packs: []
      },
      'manifests.json': {
        manifests: {}
      },
      'orders.json': {
        orders: []
      },
      'products.json': {
        products: []
      }
    };
    
    return defaults[filename] || {};
  }

  /**
   * List all JSON files in data directory
   * @returns {Array} List of filenames
   */
  async listFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      winston.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Get file stats
   * @param {string} filename - Name of the file
   * @returns {Object} File stats
   */
  async getFileStats(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    } catch (error) {
      winston.error(`Error getting stats for ${filename}:`, error);
      return null;
    }
  }

  /**
   * Validate JSON structure
   * @param {string} filename - Name of the file
   * @param {Object} data - Data to validate
   * @returns {boolean} Validation result
   */
  validateStructure(filename, data) {
    try {
      switch (filename) {
        case 'packs.json':
          return Array.isArray(data.packs);
        case 'manifests.json':
          return typeof data.manifests === 'object';
        case 'orders.json':
          return Array.isArray(data.orders);
        default:
          return true;
      }
    } catch (error) {
      winston.error(`Validation failed for ${filename}:`, error);
      return false;
    }
  }
}

module.exports = new FileManager();
