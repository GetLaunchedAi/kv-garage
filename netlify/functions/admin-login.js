exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Mock admin credentials for demo
    const mockAdmin = {
      email: 'admin@kvgarage.com',
      password: 'admin123'
    };

    if (email === mockAdmin.email && password === mockAdmin.password) {
      // Mock JWT token
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: mockToken,
          user: {
            id: 1,
            email: mockAdmin.email,
            name: 'Admin User',
            role: 'admin'
          }
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      };
    }
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
