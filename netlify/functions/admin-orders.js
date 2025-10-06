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
    // Mock orders data
    const mockOrders = [
      {
        id: 'order-1',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        pack_name: 'Starter Pack',
        pack_type: 'starter',
        payment_mode: 'full',
        amount_paid: 299.99,
        total_amount: 299.99,
        status: 'pending',
        created_at: new Date().toISOString(),
        stripe_checkout_session_id: 'cs_test_123'
      },
      {
        id: 'order-2',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        pack_name: 'Reseller Pack',
        pack_type: 'reseller',
        payment_mode: 'deposit',
        amount_paid: 150.00,
        total_amount: 599.99,
        status: 'reserved',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        stripe_checkout_session_id: 'cs_test_456'
      },
      {
        id: 'order-3',
        customer_name: 'Bob Johnson',
        customer_email: 'bob@example.com',
        pack_name: 'Pro Pack',
        pack_type: 'pro',
        payment_mode: 'full',
        amount_paid: 999.99,
        total_amount: 999.99,
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        stripe_checkout_session_id: 'cs_test_789'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: mockOrders,
        pagination: {
          limit: 50,
          offset: 0,
          total: mockOrders.length
        }
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
