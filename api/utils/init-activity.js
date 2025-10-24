/**
 * Initialize Activity System
 * Creates sample activity data for testing
 */

const fileManager = require('./file-manager');
const ActivityLogger = require('./activity-logger');

async function initializeActivitySystem() {
  try {
    console.log('Initializing activity system...');
    
    // Create initial activity data structure
    const activityData = {
      activities: [],
      created_at: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Save initial structure
    await fileManager.writeJSON('activity.json', activityData);
    
    // Create some sample activities
    const sampleActivities = [
      {
        type: 'system_action',
        description: 'Activity tracking system initialized',
        user: 'system',
        metadata: { action: 'system_init' }
      },
      {
        type: 'admin_action',
        description: 'Admin dashboard accessed',
        user: 'admin@example.com',
        metadata: { action: 'dashboard_access' }
      },
      {
        type: 'pack_created',
        description: 'New pack "Starter Electronics Pack" created',
        user: 'admin@example.com',
        metadata: { 
          pack_id: 'sample_pack_1',
          pack_name: 'Starter Electronics Pack',
          pack_status: 'available'
        }
      },
      {
        type: 'custom_request_created',
        description: 'New custom pack request from john@example.com',
        user: 'customer',
        metadata: {
          request_id: 'REQ-sample-1',
          customer_email: 'john@example.com',
          status: 'pending'
        }
      },
      {
        type: 'order_created',
        description: 'New order #ORD-1001 placed by Jane Smith',
        user: 'customer',
        metadata: {
          order_id: 'ORD-1001',
          customer_name: 'Jane Smith',
          order_status: 'pending',
          total_amount: 299.99
        }
      }
    ];
    
    // Add sample activities with timestamps
    for (let i = 0; i < sampleActivities.length; i++) {
      const activity = sampleActivities[i];
      const timestamp = new Date(Date.now() - (i * 2 * 60 * 60 * 1000)); // 2 hours apart
      
      await ActivityLogger.logActivity(
        activity.type,
        activity.description,
        activity.metadata,
        activity.user
      );
    }
    
    console.log('Activity system initialized with sample data');
    console.log('Sample activities created:', sampleActivities.length);
    
  } catch (error) {
    console.error('Error initializing activity system:', error);
  }
}

// Run if called directly
if (require.main === module) {
  initializeActivitySystem()
    .then(() => {
      console.log('Activity system initialization complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeActivitySystem };
