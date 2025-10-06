const PDFDocument = require('pdfkit');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

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

    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const base64Pdf = pdfBuffer.toString('base64');
        
        resolve({
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="kv-garage-hero-catalog.pdf"',
            'Content-Length': pdfBuffer.length.toString(),
          },
          body: base64Pdf,
          isBase64Encoded: true,
        });
      });

      doc.on('error', reject);

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
    });

  } catch (error) {
    console.error('Error generating hero catalog PDF:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate hero catalog',
        message: error.message 
      }),
    };
  }
};
