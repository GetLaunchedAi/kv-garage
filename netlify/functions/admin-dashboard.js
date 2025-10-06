exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Mock dashboard data
    const dashboardData = {
      totalPacks: 3,
      totalOrders: 15,
      totalRevenue: 12500.00,
      pendingOrders: 3,
      recentActivity: [
        {
          id: 1,
          type: 'order',
          message: 'New order for Starter Pack',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'custom_request',
          message: 'Custom pack request submitted',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: dashboardData
      })
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
