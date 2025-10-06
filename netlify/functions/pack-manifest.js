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

  // Extract pack ID from path
  let packId;
  if (event.pathParameters && event.pathParameters.id) {
    packId = event.pathParameters.id;
  } else {
    const pathParts = event.path.split('/');
    packId = pathParts[pathParts.length - 1];
  }

  // Mock manifest data for each pack
  const mockManifests = {
    '1': {
      pack_id: 1,
      pack_name: 'Starter Pack',
      pack_type: 'starter',
      total_items: 250,
      total_estimated_value: 750.00,
      created_date: '2024-01-15T10:00:00Z',
      items: [
        {
          sku: 'IPHONE-12-128GB',
          name: 'iPhone 12 128GB',
          quantity: 5,
          condition: 'Good',
          estimated_value: 450.00,
          category: 'Smartphones',
          brand: 'Apple'
        },
        {
          sku: 'SAMSUNG-GALAXY-S21',
          name: 'Samsung Galaxy S21',
          quantity: 3,
          condition: 'Excellent',
          estimated_value: 380.00,
          category: 'Smartphones',
          brand: 'Samsung'
        },
        {
          sku: 'AIRPODS-PRO-2',
          name: 'AirPods Pro 2nd Gen',
          quantity: 8,
          condition: 'Good',
          estimated_value: 180.00,
          category: 'Audio',
          brand: 'Apple'
        },
        {
          sku: 'LIGHTNING-CABLE-1M',
          name: 'Lightning Cable 1m',
          quantity: 25,
          condition: 'New',
          estimated_value: 15.00,
          category: 'Cables',
          brand: 'Generic'
        },
        {
          sku: 'USB-C-CABLE-2M',
          name: 'USB-C Cable 2m',
          quantity: 20,
          condition: 'New',
          estimated_value: 12.00,
          category: 'Cables',
          brand: 'Generic'
        },
        {
          sku: 'WIRELESS-CHARGER',
          name: 'Wireless Charging Pad',
          quantity: 12,
          condition: 'Good',
          estimated_value: 25.00,
          category: 'Accessories',
          brand: 'Generic'
        },
        {
          sku: 'PHONE-CASE-IPHONE',
          name: 'iPhone Protective Case',
          quantity: 15,
          condition: 'New',
          estimated_value: 8.00,
          category: 'Accessories',
          brand: 'Generic'
        },
        {
          sku: 'BLUETOOTH-SPEAKER',
          name: 'Portable Bluetooth Speaker',
          quantity: 6,
          condition: 'Good',
          estimated_value: 35.00,
          category: 'Audio',
          brand: 'Generic'
        },
        {
          sku: 'POWER-BANK-10000',
          name: '10,000mAh Power Bank',
          quantity: 10,
          condition: 'Good',
          estimated_value: 22.00,
          category: 'Accessories',
          brand: 'Generic'
        },
        {
          sku: 'SCREEN-PROTECTOR',
          name: 'Tempered Glass Screen Protector',
          quantity: 30,
          condition: 'New',
          estimated_value: 5.00,
          category: 'Accessories',
          brand: 'Generic'
        }
      ]
    },
    '2': {
      pack_id: 2,
      pack_name: 'Reseller Pack',
      pack_type: 'reseller',
      total_items: 500,
      total_estimated_value: 1500.00,
      created_date: '2024-01-15T10:00:00Z',
      items: [
        {
          sku: 'IPHONE-13-256GB',
          name: 'iPhone 13 256GB',
          quantity: 8,
          condition: 'Excellent',
          estimated_value: 650.00,
          category: 'Smartphones',
          brand: 'Apple'
        },
        {
          sku: 'SAMSUNG-GALAXY-S22',
          name: 'Samsung Galaxy S22',
          quantity: 6,
          condition: 'Good',
          estimated_value: 520.00,
          category: 'Smartphones',
          brand: 'Samsung'
        },
        {
          sku: 'IPAD-AIR-5TH',
          name: 'iPad Air 5th Gen',
          quantity: 4,
          condition: 'Good',
          estimated_value: 480.00,
          category: 'Tablets',
          brand: 'Apple'
        },
        {
          sku: 'MACBOOK-AIR-M2',
          name: 'MacBook Air M2',
          quantity: 2,
          condition: 'Excellent',
          estimated_value: 1200.00,
          category: 'Laptops',
          brand: 'Apple'
        },
        {
          sku: 'AIRPODS-MAX',
          name: 'AirPods Max',
          quantity: 5,
          condition: 'Good',
          estimated_value: 400.00,
          category: 'Audio',
          brand: 'Apple'
        },
        {
          sku: 'APPLE-WATCH-SE',
          name: 'Apple Watch SE',
          quantity: 7,
          condition: 'Good',
          estimated_value: 220.00,
          category: 'Wearables',
          brand: 'Apple'
        },
        {
          sku: 'SAMSUNG-BUDS-PRO',
          name: 'Samsung Galaxy Buds Pro',
          quantity: 10,
          condition: 'Good',
          estimated_value: 150.00,
          category: 'Audio',
          brand: 'Samsung'
        },
        {
          sku: 'WIRELESS-CHARGER-FAST',
          name: 'Fast Wireless Charging Pad',
          quantity: 15,
          condition: 'New',
          estimated_value: 35.00,
          category: 'Accessories',
          brand: 'Generic'
        },
        {
          sku: 'MAGSAFE-CHARGER',
          name: 'MagSafe Charger',
          quantity: 12,
          condition: 'New',
          estimated_value: 40.00,
          category: 'Accessories',
          brand: 'Apple'
        },
        {
          sku: 'LAPTOP-STAND',
          name: 'Adjustable Laptop Stand',
          quantity: 8,
          condition: 'Good',
          estimated_value: 45.00,
          category: 'Accessories',
          brand: 'Generic'
        }
      ]
    },
    '3': {
      pack_id: 3,
      pack_name: 'Pro Pack',
      pack_type: 'pro',
      total_items: 1000,
      total_estimated_value: 3000.00,
      created_date: '2024-01-15T10:00:00Z',
      items: [
        {
          sku: 'IPHONE-14-PRO-256GB',
          name: 'iPhone 14 Pro 256GB',
          quantity: 12,
          condition: 'Excellent',
          estimated_value: 850.00,
          category: 'Smartphones',
          brand: 'Apple'
        },
        {
          sku: 'SAMSUNG-GALAXY-S23-ULTRA',
          name: 'Samsung Galaxy S23 Ultra',
          quantity: 8,
          condition: 'Excellent',
          estimated_value: 950.00,
          category: 'Smartphones',
          brand: 'Samsung'
        },
        {
          sku: 'IPAD-PRO-12.9-M2',
          name: 'iPad Pro 12.9" M2',
          quantity: 6,
          condition: 'Excellent',
          estimated_value: 1100.00,
          category: 'Tablets',
          brand: 'Apple'
        },
        {
          sku: 'MACBOOK-PRO-14-M2',
          name: 'MacBook Pro 14" M2',
          quantity: 4,
          condition: 'Excellent',
          estimated_value: 1800.00,
          category: 'Laptops',
          brand: 'Apple'
        },
        {
          sku: 'AIRPODS-PRO-2',
          name: 'AirPods Pro 2nd Gen',
          quantity: 15,
          condition: 'New',
          estimated_value: 200.00,
          category: 'Audio',
          brand: 'Apple'
        },
        {
          sku: 'APPLE-WATCH-ULTRA',
          name: 'Apple Watch Ultra',
          quantity: 5,
          condition: 'Excellent',
          estimated_value: 700.00,
          category: 'Wearables',
          brand: 'Apple'
        },
        {
          sku: 'SAMSUNG-TAB-S8-ULTRA',
          name: 'Samsung Galaxy Tab S8 Ultra',
          quantity: 3,
          condition: 'Excellent',
          estimated_value: 800.00,
          category: 'Tablets',
          brand: 'Samsung'
        },
        {
          sku: 'SURFACE-PRO-9',
          name: 'Microsoft Surface Pro 9',
          quantity: 4,
          condition: 'Good',
          estimated_value: 900.00,
          category: 'Tablets',
          brand: 'Microsoft'
        },
        {
          sku: 'DELL-XPS-13',
          name: 'Dell XPS 13',
          quantity: 3,
          condition: 'Good',
          estimated_value: 1000.00,
          category: 'Laptops',
          brand: 'Dell'
        },
        {
          sku: 'SONY-WH-1000XM5',
          name: 'Sony WH-1000XM5 Headphones',
          quantity: 8,
          condition: 'Excellent',
          estimated_value: 300.00,
          category: 'Audio',
          brand: 'Sony'
        }
      ]
    }
  };

  const manifest = mockManifests[packId];

  if (!manifest) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Manifest not found for this pack'
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: manifest
    }),
  };
};
