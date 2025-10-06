const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { logger } = require('../utils/logger');
const { PDFDocument, rgb } = require('pdf-lib');

const router = express.Router();

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

// GET /api/manifests/:packId - Get manifest for a pack
router.get('/:packId', [
  param('packId').isInt({ min: 1 }),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
], validateRequest, async (req, res) => {
  try {
    const { packId } = req.params;
    const format = req.query.format || 'json';

    // Get pack details
    const packResult = await dbQuery(
      'SELECT * FROM packs WHERE id = $1',
      [packId]
    );

    if (packResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pack not found' 
      });
    }

    const pack = packResult.rows[0];

    // Get manifest items
    const manifestResult = await dbQuery(
      `SELECT 
        sku, product_name, quantity, condition_grade, 
        description, image, estimated_value, category, brand
      FROM manifests 
      WHERE pack_id = $1 
      ORDER BY category, product_name`,
      [packId]
    );

    const manifest = manifestResult.rows;

    // Calculate totals
    const totalItems = manifest.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = manifest.reduce((sum, item) => sum + (item.estimated_value * item.quantity), 0);

    const manifestData = {
      pack: {
        id: pack.id,
        name: pack.name,
        type: pack.type,
        price: pack.price,
        units: pack.units,
        resale_estimate: pack.resale_estimate
      },
      manifest: manifest,
      totals: {
        total_items: totalItems,
        total_estimated_value: totalValue
      },
      generated_at: new Date().toISOString()
    };

    // Return in requested format
    switch (format) {
      case 'csv':
        const csv = generateManifestCSV(manifestData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="manifest-${pack.name.replace(/\s+/g, '-').toLowerCase()}.csv"`);
        return res.send(csv);

      case 'pdf':
        const pdfBuffer = await generateManifestPDF(manifestData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="manifest-${pack.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
        return res.send(pdfBuffer);

      default:
        res.json({
          success: true,
          data: manifestData
        });
    }

  } catch (error) {
    logger.error('Error fetching manifest:', error);
    res.status(500).json({ 
      error: 'Failed to fetch manifest',
      message: error.message 
    });
  }
});

// Generate CSV format manifest
function generateManifestCSV(manifestData) {
  const { pack, manifest } = manifestData;
  
  const headers = ['SKU', 'Product Name', 'Quantity', 'Condition', 'Category', 'Brand', 'Est. Value', 'Total Value'];
  const rows = manifest.map(item => [
    item.sku,
    item.product_name,
    item.quantity,
    item.condition_grade,
    item.category || '',
    item.brand || '',
    item.estimated_value,
    (item.estimated_value * item.quantity).toFixed(2)
  ]);

  // Add pack summary
  rows.push([]);
  rows.push(['PACK SUMMARY', '', '', '', '', '', '', '']);
  rows.push(['Pack Name', pack.name, '', '', '', '', '', '']);
  rows.push(['Pack Type', pack.type, '', '', '', '', '', '']);
  rows.push(['Total Items', manifestData.totals.total_items, '', '', '', '', '', '']);
  rows.push(['Total Est. Value', '', '', '', '', '', '', manifestData.totals.total_estimated_value.toFixed(2)]);
  rows.push(['Your Cost', pack.price, '', '', '', '', '', '']);
  rows.push(['Est. Profit', '', '', '', '', '', '', (manifestData.totals.total_estimated_value - pack.price).toFixed(2)]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Generate PDF format manifest
async function generateManifestPDF(manifestData) {
  const { pack, manifest, totals } = manifestData;
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Set up fonts
  const font = await pdfDoc.embedFont('Helvetica');
  const boldFont = await pdfDoc.embedFont('Helvetica-Bold');

  let yPosition = height - 50;

  // Header
  page.drawText('KV GARAGE WHOLESALE', {
    x: 50,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 30;

  page.drawText('PACK MANIFEST', {
    x: 50,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 40;

  // Pack information
  page.drawText(`Pack: ${pack.name}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 20;

  page.drawText(`Type: ${pack.type.toUpperCase()}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0)
  });
  yPosition -= 20;

  page.drawText(`Your Cost: $${pack.price}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0)
  });
  yPosition -= 20;

  page.drawText(`Est. Resale Value: $${totals.total_estimated_value.toFixed(2)}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0)
  });
  yPosition -= 20;

  page.drawText(`Est. Profit: $${(totals.total_estimated_value - pack.price).toFixed(2)}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: rgb(0, 0.5, 0)
  });
  yPosition -= 40;

  // Manifest table header
  page.drawText('MANIFEST CONTENTS', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 30;

  // Table headers
  const tableHeaders = ['SKU', 'Product', 'Qty', 'Condition', 'Est. Value', 'Total'];
  const colWidths = [80, 200, 40, 60, 80, 80];
  let xPosition = 50;

  tableHeaders.forEach((header, index) => {
    page.drawText(header, {
      x: xPosition,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    xPosition += colWidths[index];
  });
  yPosition -= 20;

  // Draw line under headers
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 590, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  yPosition -= 15;

  // Manifest items
  manifest.forEach((item, index) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([612, 792]);
      yPosition = newPage.getSize().height - 50;
    }

    xPosition = 50;
    const rowData = [
      item.sku,
      item.product_name.length > 25 ? item.product_name.substring(0, 25) + '...' : item.product_name,
      item.quantity.toString(),
      item.condition_grade,
      `$${item.estimated_value.toFixed(2)}`,
      `$${(item.estimated_value * item.quantity).toFixed(2)}`
    ];

    rowData.forEach((data, colIndex) => {
      page.drawText(data, {
        x: xPosition,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0, 0, 0)
      });
      xPosition += colWidths[colIndex];
    });

    yPosition -= 15;
  });

  // Footer
  yPosition -= 30;
  page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
}

module.exports = router;
