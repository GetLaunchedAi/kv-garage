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

  // Extract pack ID from path or query parameters
  let packId;
  if (event.pathParameters && event.pathParameters.id) {
    packId = event.pathParameters.id;
  } else {
    const pathParts = event.path.split('/');
    packId = pathParts[pathParts.length - 1];
  }

  // Mock pack data
  const mockPacks = {
    '1': {
      id: 1,
      name: 'Starter Pack',
      description: 'Perfect for new resellers looking to get started in the tech liquidation business. This pack contains a curated mix of mobile accessories, cables, and small electronics.',
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
    '2': {
      id: 2,
      name: 'Reseller Pack',
      description: 'Ideal for established resellers looking to scale their business. This pack includes a diverse mix of consumer electronics, accessories, and trending tech items.',
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
    '3': {
      id: 3,
      name: 'Pro Pack',
      description: 'For professional resellers and businesses. This premium pack contains high-value electronics, premium accessories, and exclusive tech items with maximum profit potential.',
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
  };

  const pack = mockPacks[packId];

  if (!pack) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Pack not found'
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: pack
    }),
  };
};
