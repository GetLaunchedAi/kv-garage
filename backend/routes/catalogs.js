const express = require('express');
const { query: dbQuery } = require('../config/database');
const { logger } = require('../utils/logger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/catalogs/hero - Generate Hero Catalog PDF
router.get('/hero', async (req, res) => {
  try {
    // Get all available packs
    const packsResult = await dbQuery(`
      SELECT p.*, 
             COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) as available_quantity
      FROM packs p
      LEFT JOIN inventory_log il ON p.id = il.pack_id
      WHERE p.status = 'available'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const packs = packsResult.rows;

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
       .text('Phone: (616) 228-2244 • Email: support@kvgarage.com', 50, 130, { align: 'center' });

    // Add trust signals
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#10b981')
       .text('✓ Verified Suppliers • 2.5x Average ROI • 24hr Fast Shipping • 100% Satisfaction', 50, 160, { align: 'center' });

    let yPosition = 200;

    // Add packs
    packs.forEach((pack, index) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Pack header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text(pack.name.toUpperCase(), 50, yPosition);

      yPosition += 25;

      // Pack details
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#374151');

      const details = [
        `Price: $${pack.price.toFixed(2)}`,
        `Estimated Resale Value: $${pack.estimated_resale_value.toFixed(2)}`,
        `Units: ${pack.number_of_units}`,
        `Available: ${pack.available_quantity}`,
        `Profit Potential: $${(pack.estimated_resale_value - pack.price).toFixed(2)} (${(((pack.estimated_resale_value - pack.price) / pack.price) * 100).toFixed(0)}%)`
      ];

      details.forEach(detail => {
        doc.text(detail, 50, yPosition);
        yPosition += 18;
      });

      // Pack description
      if (pack.description) {
        yPosition += 5;
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text(pack.description, 50, yPosition, { width: 500 });
        yPosition += 30;
      }

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
    logger.error('Error generating hero catalog:', error);
    res.status(500).json({ 
      error: 'Failed to generate catalog',
      message: error.message 
    });
  }
});

// GET /api/catalogs/pack/:id - Generate individual pack catalog
router.get('/pack/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get pack details with manifest
    const packResult = await dbQuery(`
      SELECT p.*, 
             COALESCE(SUM(CASE WHEN il.change_type = 'order_placed' THEN -il.quantity_change ELSE il.quantity_change END), p.number_of_units) as available_quantity
      FROM packs p
      LEFT JOIN inventory_log il ON p.id = il.pack_id
      WHERE p.id = $1 AND p.status = 'available'
      GROUP BY p.id
    `, [id]);

    if (packResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    const pack = packResult.rows[0];

    // Get manifest items
    const manifestResult = await dbQuery(
      'SELECT * FROM manifest_items WHERE pack_id = $1 ORDER BY item_name',
      [id]
    );

    const manifest = manifestResult.rows;

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
      `Estimated Resale Value: $${pack.estimated_resale_value.toFixed(2)}`,
      `Units in Pack: ${pack.number_of_units}`,
      `Available Quantity: ${pack.available_quantity}`,
      `Profit Potential: $${(pack.estimated_resale_value - pack.price).toFixed(2)}`,
      `ROI: ${(((pack.estimated_resale_value - pack.price) / pack.price) * 100).toFixed(0)}%`
    ];

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#374151');

    overview.forEach(item => {
      doc.text(item, 50, yPosition);
      yPosition += 18;
    });

    yPosition += 20;

    // Payment options
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Payment Options', 50, yPosition);

    yPosition += 25;

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Full Payment: $${pack.price.toFixed(2)}`, 50, yPosition);

    yPosition += 18;

    if (pack.deposit_price) {
      doc.text(`50% Deposit: $${pack.deposit_price.toFixed(2)} (Reserve your pack)`, 50, yPosition);
      doc.text(`Remaining Balance: $${(pack.price - pack.deposit_price).toFixed(2)}`, 50, yPosition + 18);
      yPosition += 36;
    }

    yPosition += 20;

    // Pack description
    if (pack.description) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Description', 50, yPosition);

      yPosition += 25;

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#374151')
         .text(pack.description, 50, yPosition, { width: 500 });

      yPosition += 40;
    }

    // Manifest section
    if (manifest.length > 0) {
      // Check if we need a new page
      if (yPosition > 400) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Pack Manifest', 50, yPosition);

      yPosition += 25;

      // Table header
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151');

      const tableTop = yPosition;
      const itemHeight = 20;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;
      const col4 = 450;

      // Draw table header
      doc.text('SKU', col1, tableTop);
      doc.text('Item Name', col2, tableTop);
      doc.text('Quantity', col3, tableTop);
      doc.text('Condition', col4, tableTop);

      // Draw header line
      doc.strokeColor('#374151')
         .lineWidth(1)
         .moveTo(col1, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      yPosition = tableTop + 20;

      // Add manifest items
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#374151');

      manifest.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
          
          // Redraw header
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('#374151')
             .text('SKU', col1, yPosition);
          doc.text('Item Name', col2, yPosition);
          doc.text('Quantity', col3, yPosition);
          doc.text('Condition', col4, yPosition);

          doc.strokeColor('#374151')
             .lineWidth(1)
             .moveTo(col1, yPosition + 15)
             .lineTo(550, yPosition + 15)
             .stroke();

          yPosition += 20;
          
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#374151');
        }

        doc.text(item.sku || 'N/A', col1, yPosition);
        doc.text(item.item_name, col2, yPosition);
        doc.text(item.quantity.toString(), col3, yPosition);
        doc.text(item.condition || 'N/A', col4, yPosition);

        yPosition += itemHeight;
      });
    }

    // Add contact information
    yPosition += 30;
    
    if (yPosition > 600) {
      doc.addPage();
      yPosition = 50;
    }

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
    
    yPosition += 18;
    
    doc.text('Website: kvgarage.com', 50, yPosition);

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
    logger.error('Error generating pack catalog:', error);
    res.status(500).json({ 
      error: 'Failed to generate pack catalog',
      message: error.message 
    });
  }
});

module.exports = router;
