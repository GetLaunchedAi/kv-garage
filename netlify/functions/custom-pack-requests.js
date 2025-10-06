exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Mock custom pack requests
      const mockRequests = [
        {
          id: 1,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          business_name: 'Tech Reseller Co',
          request_description: 'Looking for iPhone accessories and cables',
          estimated_budget: 500.00,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          business_name: 'Mobile Accessories Inc',
          request_description: 'Need gaming accessories and phone cases',
          estimated_budget: 750.00,
          status: 'reviewed',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: mockRequests
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Handle status updates
      const { status } = JSON.parse(event.body);
      const requestId = event.path.split('/').pop().replace('/status', '');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            id: requestId,
            status: status,
            updated_at: new Date().toISOString()
          },
          message: `Request ${status} successfully`
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
