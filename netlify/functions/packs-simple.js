exports.handler = async (event, context) => {
  console.log('Simple packs function called:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Simple test data
  const testPacks = [
    {
      id: 1,
      name: 'Test Pack',
      description: 'Test pack for debugging',
      price: 299.99,
      deposit_price: 149.99,
      number_of_units: 250,
      estimated_resale_value: 750.00,
      image_url: '/images/packs/test-pack.jpg',
      status: 'active',
      available_quantity: 15,
      reserved_quantity: 5,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ];

  const response = {
    packs: testPacks,
    total: testPacks.length,
    filters: {}
  };

  console.log('Simple packs response:', JSON.stringify(response, null, 2));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response),
  };
};
