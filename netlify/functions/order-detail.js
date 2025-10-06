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
      // Mock order details
      const orderId = event.path.split('/').pop();
      const mockOrder = {
        id: orderId,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        pack_name: 'Starter Pack',
        pack_type: 'starter',
        payment_mode: 'full',
        amount_paid: 299.99,
        total_amount: 299.99,
        status: 'pending',
        created_at: new Date().toISOString(),
        stripe_checkout_session_id: 'cs_test_123',
        pack_description: 'Perfect for small resellers starting out',
        pack_image: '/images/packs/starter-pack.jpg',
        pack_price: 299.99,
        pack_deposit_price: 150.00,
        estimated_resale_value: 450.00
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: mockOrder
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Handle order status updates
      const orderId = event.path.split('/').pop().replace('/status', '');
      const { status, notes } = JSON.parse(event.body);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            id: orderId,
            status: status,
            notes: notes,
            updated_at: new Date().toISOString()
          },
          message: 'Order status updated successfully'
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
