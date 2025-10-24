/**
 * CSV Parser Utility
 * Handles CSV file parsing and validation for manifest uploads
 */

const csv = require('csv-parser');
const fs = require('fs');
const winston = require('winston');

class CSVParser {
  constructor() {
    // Smart Environment Detection
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.requiredFields = ['sku', 'item_name', 'quantity', 'condition'];
    this.optionalFields = ['product_name', 'condition_grade', 'notes', 'estimated_value', 'category', 'brand'];
    
    // Environment logging
    console.log(`📊 CSVParser - Environment: ${isProduction ? 'production' : 'localhost'}`);
  }

  /**
   * Parse manifest CSV file and validate data
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<Array>} Parsed and validated manifest items
   */
  async parseManifestCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;
      
      winston.info(`Starting CSV parsing for: ${filePath}`);
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          
          try {
            // Debug: Log the raw row data
            winston.info(`Processing row ${rowNumber}:`, row);
            
            // Map headers to expected field names
            const mappedRow = this.mapHeadersToFields(row);
            winston.info(`Mapped row ${rowNumber}:`, mappedRow);
            
            // Validate required fields
            const missingFields = this.requiredFields.filter(field => 
              !mappedRow[field] || mappedRow[field].trim() === ''
            );
            
            if (missingFields.length > 0) {
              errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
              return;
            }
            
            // Validate and clean data
            const manifestItem = this.validateAndCleanRow(mappedRow, rowNumber);
            if (manifestItem) {
              results.push(manifestItem);
              winston.info(`Successfully processed row ${rowNumber}:`, manifestItem);
            } else {
              winston.warn(`Row ${rowNumber} validation returned null`);
            }
          } catch (error) {
            errors.push(`Row ${rowNumber}: ${error.message}`);
            winston.error(`Row ${rowNumber} error:`, error);
          }
        })
        .on('end', () => {
          winston.info(`CSV parsing completed. ${results.length} valid rows, ${errors.length} errors`);
          
          if (errors.length > 0) {
            winston.warn('CSV validation errors:', errors);
            reject(new Error(`CSV validation failed:\n${errors.join('\n')}`));
          } else if (results.length === 0) {
            reject(new Error('No valid data found in CSV file'));
          } else {
            resolve(results);
          }
        })
        .on('error', (error) => {
          winston.error('CSV parsing error:', error);
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        });
    });
  }

  /**
   * Map CSV headers to expected field names
   * @param {Object} row - Raw CSV row data
   * @returns {Object} Mapped row with expected field names
   */
  mapHeadersToFields(row) {
    const mappedRow = {};
    
    // Debug: Log available headers
    winston.info('Available headers in row:', Object.keys(row));
    
    // Define header mappings
    const headerMappings = {
      'SKU': 'sku',
      'Name': 'item_name',
      'Quantity': 'quantity',
      'Condition': 'condition',
      'Brand': 'brand',
      'Category': 'category',
      'Estimated Value': 'estimated_value'
    };
    
    // Map each field
    Object.keys(row).forEach(header => {
      const mappedField = headerMappings[header];
      if (mappedField) {
        mappedRow[mappedField] = row[header];
        winston.info(`Mapped ${header} -> ${mappedField}: ${row[header]}`);
      } else {
        // Keep original field name if no mapping found
        mappedRow[header.toLowerCase()] = row[header];
        winston.info(`No mapping for ${header}, using lowercase: ${header.toLowerCase()}`);
      }
    });
    
    winston.info('Final mapped row:', mappedRow);
    return mappedRow;
  }

  /**
   * Validate and clean a single CSV row
   * @param {Object} row - Raw CSV row data
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object|null} Cleaned manifest item or null if invalid
   */
  validateAndCleanRow(row, rowNumber) {
    try {
      // Validate SKU (required, non-empty)
      const sku = row.sku?.trim();
      if (!sku) {
        throw new Error('SKU is required');
      }

      // Validate item name (required, non-empty)
      const itemName = row.item_name?.trim();
      if (!itemName) {
        throw new Error('Item name is required');
      }

      // Validate quantity (required, positive integer)
      const quantity = parseInt(row.quantity);
      if (isNaN(quantity) || quantity < 0) {
        throw new Error(`Invalid quantity: ${row.quantity}. Must be a positive number.`);
      }

      // Validate condition (required, non-empty)
      const condition = row.condition?.trim().toLowerCase();
      if (!condition) {
        throw new Error('Condition is required');
      }

      // Validate estimated value (optional, but must be a number if provided)
      let estimatedValue = 0;
      if (row.estimated_value && row.estimated_value.trim() !== '') {
        // Remove dollar sign and parse as float
        const cleanValue = row.estimated_value.replace(/[$,]/g, '');
        estimatedValue = parseFloat(cleanValue);
        if (isNaN(estimatedValue) || estimatedValue < 0) {
          throw new Error(`Invalid estimated value: ${row.estimated_value}. Must be a positive number.`);
        }
      }

      // Clean and structure data
      const manifestItem = {
        sku: sku,
        item_name: itemName,
        product_name: row.product_name?.trim() || itemName,
        quantity: quantity,
        condition: condition,
        condition_grade: row.condition_grade?.trim() || condition,
        notes: row.notes?.trim() || '',
        estimated_value: estimatedValue,
        category: row.category?.trim() || 'Uncategorized',
        brand: row.brand?.trim() || 'Generic'
      };

      return manifestItem;
    } catch (error) {
      winston.warn(`Row ${rowNumber} validation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get CSV template structure
   * @returns {Object} Template with required and optional fields
   */
  getTemplate() {
    return {
      required_fields: this.requiredFields,
      optional_fields: this.optionalFields,
      supported_headers: {
        'SKU': 'sku',
        'Name': 'item_name', 
        'Quantity': 'quantity',
        'Condition': 'condition',
        'Brand': 'brand',
        'Category': 'category',
        'Estimated Value': 'estimated_value'
      },
      example_row: {
        sku: 'CASE-001',
        item_name: 'iPhone 12/13 Clear Case',
        product_name: 'iPhone 12/13 Clear Case',
        quantity: 25,
        condition: 'new',
        condition_grade: 'new',
        notes: 'Clear protective case, various colors',
        estimated_value: 12.00,
        category: 'Phone Cases',
        brand: 'Generic'
      }
    };
  }

  /**
   * Validate CSV file before processing
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<Object>} Validation result
   */
  async validateCSVFile(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('CSV file not found');
      }

      // Check file size (max 10MB)
      const stats = fs.statSync(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      }

      // Check if file is readable
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch {
        throw new Error('File is not readable');
      }

      return {
        valid: true,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      winston.error('CSV file validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get CSV parsing statistics
   * @param {Array} items - Parsed manifest items
   * @returns {Object} Statistics about the parsed data
   */
  getStatistics(items) {
    if (!items || items.length === 0) {
      return {
        total_items: 0,
        total_quantity: 0,
        total_estimated_value: 0,
        categories: {},
        conditions: {},
        brands: {}
      };
    }

    const stats = {
      total_items: items.length,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total_estimated_value: items.reduce((sum, item) => sum + (item.estimated_value * item.quantity), 0),
      categories: {},
      conditions: {},
      brands: {}
    };

    // Count categories, conditions, and brands
    items.forEach(item => {
      // Categories
      const category = item.category || 'Uncategorized';
      stats.categories[category] = (stats.categories[category] || 0) + item.quantity;

      // Conditions
      const condition = item.condition || 'unknown';
      stats.conditions[condition] = (stats.conditions[condition] || 0) + item.quantity;

      // Brands
      const brand = item.brand || 'Generic';
      stats.brands[brand] = (stats.brands[brand] || 0) + item.quantity;
    });

    return stats;
  }
}

module.exports = new CSVParser();
