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
    // Mock analytics data
    const analyticsData = {
      period: '7 days',
      totalRevenue: 12500,
      totalOrders: 15,
      averageOrderValue: 833.33,
      topSellingPacks: [
        {
          name: 'Starter Pack',
          sales: 8,
          revenue: 2399.92
        },
        {
          name: 'Reseller Pack',
          sales: 5,
          revenue: 2999.95
        },
        {
          name: 'Pro Pack',
          sales: 2,
          revenue: 1999.98
        }
      ],
      revenueByDay: [
        { date: '2024-01-01', revenue: 1200 },
        { date: '2024-01-02', revenue: 800 },
        { date: '2024-01-03', revenue: 1500 }
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: analyticsData
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
