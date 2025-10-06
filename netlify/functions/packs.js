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

  // Mock pack data
  const mockPacks = [
    {
      id: 1,
      name: 'Starter Pack',
      description: 'Perfect for new resellers looking to get started in the tech liquidation business.',
      price: 299.99,
      deposit_price: 149.99,
      number_of_units: 250,
      estimated_resale_value: 750.00,
      image_url: '/images/packs/starter-pack.jpg',
      status: 'active',
      available_quantity: 15,
      reserved_quantity: 5,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Reseller Pack',
      description: 'Ideal for established resellers looking to scale their business.',
      price: 599.99,
      deposit_price: 299.99,
      number_of_units: 500,
      estimated_resale_value: 1500.00,
      image_url: '/images/packs/reseller-pack.jpg',
      status: 'active',
      available_quantity: 8,
      reserved_quantity: 2,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 3,
      name: 'Pro Pack',
      description: 'For professional resellers and businesses.',
      price: 999.99,
      deposit_price: 499.99,
      number_of_units: 1000,
      estimated_resale_value: 3000.00,
      image_url: '/images/packs/pro-pack.jpg',
      status: 'active',
      available_quantity: 3,
      reserved_quantity: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ];

  // Parse query parameters
  const { status, min_price, max_price, min_units, max_units } = event.queryStringParameters || {};

  let filteredPacks = [...mockPacks];

  // Apply filters
  if (status) {
    filteredPacks = filteredPacks.filter(pack => pack.status === status);
  } else {
    // Default: only show active packs
    filteredPacks = filteredPacks.filter(pack => pack.status === 'active');
  }

  if (min_price) {
    filteredPacks = filteredPacks.filter(pack => pack.price >= parseFloat(min_price));
  }

  if (max_price) {
    filteredPacks = filteredPacks.filter(pack => pack.price <= parseFloat(max_price));
  }

  if (min_units) {
    filteredPacks = filteredPacks.filter(pack => pack.number_of_units >= parseInt(min_units));
  }

  if (max_units) {
    filteredPacks = filteredPacks.filter(pack => pack.number_of_units <= parseInt(max_units));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      packs: filteredPacks,
      total: filteredPacks.length,
      filters: {
        status,
        min_price,
        max_price,
        min_units,
        max_units
      }
    }),
  };
};
