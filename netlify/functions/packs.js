exports.handler = async (event, context) => {
  try {
    console.log('Packs function called:', event.httpMethod, event.path);
    
    // Handle CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Health check endpoint
  if (event.path === '/api/packs/health') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'ok', 
        message: 'Packs function is working',
        timestamp: new Date().toISOString()
      }),
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

  const response = {
    packs: filteredPacks,
    total: filteredPacks.length,
    filters: {
      status,
      min_price,
      max_price,
      min_units,
      max_units
    }
  };
  
  console.log('Returning packs response:', JSON.stringify(response, null, 2));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response),
  };
  
  } catch (error) {
    console.error('Error in packs function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
