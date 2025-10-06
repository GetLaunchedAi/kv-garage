exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Mock packs data
      const mockPacks = [
        {
          id: "1",
          name: "Starter Pack",
          slug: "starter-pack",
          type: "starter",
          price: 299.99,
          deposit_price: 149.99,
          number_of_units: 250,
          estimated_resale_value: 750,
          description: "Perfect for new resellers looking to get started in the tech liquidation business. This pack contains a curated mix of mobile accessories, cables, and small electronics.",
          short_description: "Curated mix of mobile accessories and small electronics",
          image_url: "/images/packs/starter-pack.jpg",
          status: "limited",
          available_quantity: 3,
          reserved_quantity: 2,
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          name: "Reseller Pack",
          slug: "reseller-pack",
          type: "reseller",
          price: 599.99,
          deposit_price: 299.99,
          number_of_units: 500,
          estimated_resale_value: 1500,
          description: "Ideal for established resellers looking to scale their business. This pack includes a diverse mix of consumer electronics, accessories, and trending tech items.",
          short_description: "Diverse mix of consumer electronics and trending tech",
          image_url: "/images/packs/reseller-pack.jpg",
          status: "limited",
          available_quantity: 7,
          reserved_quantity: 1,
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Pro Pack",
          slug: "pro-pack",
          type: "pro",
          price: 999.99,
          deposit_price: 499.99,
          number_of_units: 1000,
          estimated_resale_value: 3000,
          description: "For professional resellers and businesses. This premium pack contains high-value electronics, premium accessories, and exclusive tech items with maximum profit potential.",
          short_description: "Premium pack with high-value electronics and exclusive items",
          image_url: "/images/packs/pro-pack.jpg",
          status: "available",
          available_quantity: 12,
          reserved_quantity: 0,
          created_at: new Date().toISOString()
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: mockPacks
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Mock pack creation
      const packData = JSON.parse(event.body);
      const newPack = {
        id: Date.now().toString(),
        ...packData,
        created_at: new Date().toISOString()
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: newPack,
          message: 'Pack created successfully'
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Mock pack update
      const packId = event.path.split('/').pop();
      const updateData = JSON.parse(event.body);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            id: packId,
            ...updateData,
            updated_at: new Date().toISOString()
          },
          message: 'Pack updated successfully'
        })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Mock pack deletion
      const packId = event.path.split('/').pop();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Pack deleted successfully'
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
