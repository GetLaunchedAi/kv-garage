const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await query(
      `INSERT INTO admin_users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      [
        process.env.ADMIN_EMAIL || 'admin@kvgarage.com',
        adminPassword,
        'KV Garage Admin',
        'admin'
      ]
    );

    // Create sample packs
    const packs = [
      {
        name: 'Starter Pack',
        type: 'starter',
        price: 500.00,
        deposit_price: 250.00,
        units: 250,
        resale_estimate: 1200.00,
        description: 'Perfect for new resellers testing the market with a small investment. Mix includes cases, cables, screen protectors, and phone accessories.',
        short_description: 'Small test order — reserve with 50% deposit',
        image: '/images/packs/starter-pack.jpg',
        available_quantity: 5
      },
      {
        name: 'Reseller Pack',
        type: 'reseller',
        price: 1000.00,
        deposit_price: 500.00,
        units: 500,
        resale_estimate: 3000.00,
        description: 'Most popular pack for established resellers. Includes a balanced mix of high-demand tech accessories with excellent profit margins.',
        short_description: 'Most popular; free manifest preview',
        image: '/images/packs/reseller-pack.jpg',
        available_quantity: 3
      },
      {
        name: 'Pro Pack',
        type: 'pro',
        price: 2000.00,
        deposit_price: 1000.00,
        units: 1000,
        resale_estimate: 5000.00,
        description: 'For high-volume resellers and established businesses. Premium mix with exclusive items and priority access to new inventory.',
        short_description: 'For high-volume resellers; priority access',
        image: '/images/packs/pro-pack.jpg',
        available_quantity: 2
      }
    ];

    for (const pack of packs) {
      const slug = pack.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const result = await query(
        `INSERT INTO packs (
          name, slug, type, price, deposit_price, units, resale_estimate,
          description, short_description, image, available_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id`,
        [
          pack.name, slug, pack.type, pack.price, pack.deposit_price,
          pack.units, pack.resale_estimate, pack.description,
          pack.short_description, pack.image, pack.available_quantity
        ]
      );

      if (result.rows.length > 0) {
        const packId = result.rows[0].id;
        console.log(`Created pack: ${pack.name} (ID: ${packId})`);

        // Create sample manifest for each pack
        await createSampleManifest(packId, pack.type);
      }
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

async function createSampleManifest(packId, packType) {
  const manifestItems = {
    starter: [
      { sku: 'IP16CM-001', product_name: 'iPhone 16 Clear Case', quantity: 25, condition_grade: 'A', estimated_value: 6.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16PM-002', product_name: 'iPhone 16 Pro Max Case', quantity: 25, condition_grade: 'A', estimated_value: 7.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16P-003', product_name: 'iPhone 16 Pro Case', quantity: 25, condition_grade: 'A', estimated_value: 5.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'USBC-004', product_name: 'USB-C Cable 6ft', quantity: 50, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'LIGHT-005', product_name: 'Lightning Cable 6ft', quantity: 50, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'SP-006', product_name: 'Screen Protector Set', quantity: 75, condition_grade: 'A', estimated_value: 3.00, category: 'Screen Protectors', brand: 'Generic' }
    ],
    reseller: [
      { sku: 'IP16CM-001', product_name: 'iPhone 16 Clear Case', quantity: 50, condition_grade: 'A', estimated_value: 6.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16PM-002', product_name: 'iPhone 16 Pro Max Case', quantity: 50, condition_grade: 'A', estimated_value: 7.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16P-003', product_name: 'iPhone 16 Pro Case', quantity: 50, condition_grade: 'A', estimated_value: 5.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'USBC-004', product_name: 'USB-C Cable 6ft', quantity: 100, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'LIGHT-005', product_name: 'Lightning Cable 6ft', quantity: 100, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'SP-006', product_name: 'Screen Protector Set', quantity: 150, condition_grade: 'A', estimated_value: 3.00, category: 'Screen Protectors', brand: 'Generic' },
      { sku: 'WA-007', product_name: 'Watch Accessories', quantity: 50, condition_grade: 'A', estimated_value: 2.50, category: 'Watch Accessories', brand: 'Generic' },
      { sku: 'PA-008', product_name: 'Phone Accessories', quantity: 50, condition_grade: 'A', estimated_value: 4.00, category: 'Phone Accessories', brand: 'Generic' }
    ],
    pro: [
      { sku: 'IP16CM-001', product_name: 'iPhone 16 Clear Case', quantity: 100, condition_grade: 'A', estimated_value: 6.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16PM-002', product_name: 'iPhone 16 Pro Max Case', quantity: 100, condition_grade: 'A', estimated_value: 7.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'IP16P-003', product_name: 'iPhone 16 Pro Case', quantity: 100, condition_grade: 'A', estimated_value: 5.00, category: 'Mobile Accessories', brand: 'Generic' },
      { sku: 'USBC-004', product_name: 'USB-C Cable 6ft', quantity: 200, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'LIGHT-005', product_name: 'Lightning Cable 6ft', quantity: 200, condition_grade: 'A', estimated_value: 3.00, category: 'Cables & Chargers', brand: 'Generic' },
      { sku: 'SP-006', product_name: 'Screen Protector Set', quantity: 300, condition_grade: 'A', estimated_value: 3.00, category: 'Screen Protectors', brand: 'Generic' },
      { sku: 'WA-007', product_name: 'Watch Accessories', quantity: 100, condition_grade: 'A', estimated_value: 2.50, category: 'Watch Accessories', brand: 'Generic' },
      { sku: 'PA-008', product_name: 'Phone Accessories', quantity: 100, condition_grade: 'A', estimated_value: 4.00, category: 'Phone Accessories', brand: 'Generic' },
      { sku: 'EAR-009', product_name: 'Wireless Earbuds', quantity: 50, condition_grade: 'A', estimated_value: 8.00, category: 'Audio', brand: 'Generic' }
    ]
  };

  const items = manifestItems[packType] || manifestItems.starter;

  for (const item of items) {
    await query(
      `INSERT INTO manifests (
        pack_id, sku, product_name, quantity, condition_grade,
        estimated_value, category, brand
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (pack_id, sku) DO NOTHING`,
      [
        packId, item.sku, item.product_name, item.quantity,
        item.condition_grade, item.estimated_value, item.category, item.brand
      ]
    );
  }

  console.log(`Created manifest for pack ID ${packId} with ${items.length} items`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
