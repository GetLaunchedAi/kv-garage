const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Lead form submission endpoint
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      business_type,
      interest_level,
      source,
      timestamp,
      user_agent,
      referrer
    } = req.body;

    // Validate required fields
    if (!name || !email || !business_type || !interest_level) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Create lead object
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      business_type,
      interest_level,
      source: source || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      user_agent: user_agent || req.get('User-Agent'),
      referrer: referrer || req.get('Referer') || 'direct',
      ip_address: req.ip || req.connection.remoteAddress,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save lead to file (you can replace this with database storage)
    const leadsDir = path.join(__dirname, '../data/leads');
    const leadsFile = path.join(leadsDir, 'leads.json');

    // Ensure leads directory exists
    try {
      await fs.mkdir(leadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Read existing leads
    let leads = [];
    try {
      const existingData = await fs.readFile(leadsFile, 'utf8');
      leads = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      leads = [];
    }

    // Add new lead
    leads.push(lead);

    // Save updated leads
    await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));

    // Log the lead submission
    console.log(`New lead submitted: ${lead.email} (${lead.business_type})`);

    // Send notification email (optional - you can implement this)
    // await sendLeadNotification(lead);

    res.status(200).json({
      success: true,
      message: 'Lead submitted successfully',
      lead_id: lead.id
    });

  } catch (error) {
    console.error('Error processing lead submission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all leads (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const leadsFile = path.join(__dirname, '../data/leads/leads.json');
    
    try {
      const data = await fs.readFile(leadsFile, 'utf8');
      const leads = JSON.parse(data);
      
      res.status(200).json({
        success: true,
        leads: leads,
        count: leads.length
      });
    } catch (error) {
      // File doesn't exist yet
      res.status(200).json({
        success: true,
        leads: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get lead by ID (admin endpoint)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leadsFile = path.join(__dirname, '../data/leads/leads.json');
    
    try {
      const data = await fs.readFile(leadsFile, 'utf8');
      const leads = JSON.parse(data);
      const lead = leads.find(l => l.id === id);
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found'
        });
      }
      
      res.status(200).json({
        success: true,
        lead: lead
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update lead status (admin endpoint)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['new', 'contacted', 'qualified', 'converted', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const leadsFile = path.join(__dirname, '../data/leads/leads.json');
    
    try {
      const data = await fs.readFile(leadsFile, 'utf8');
      const leads = JSON.parse(data);
      const leadIndex = leads.findIndex(l => l.id === id);
      
      if (leadIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found'
        });
      }
      
      leads[leadIndex].status = status;
      leads[leadIndex].updated_at = new Date().toISOString();
      
      await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
      
      res.status(200).json({
        success: true,
        message: 'Lead status updated',
        lead: leads[leadIndex]
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete lead (admin endpoint)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leadsFile = path.join(__dirname, '../data/leads/leads.json');
    
    try {
      const data = await fs.readFile(leadsFile, 'utf8');
      const leads = JSON.parse(data);
      const leadIndex = leads.findIndex(l => l.id === id);
      
      if (leadIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found'
        });
      }
      
      const deletedLead = leads.splice(leadIndex, 1)[0];
      await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
      
      res.status(200).json({
        success: true,
        message: 'Lead deleted',
        lead: deletedLead
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export leads to CSV (admin endpoint)
router.get('/export/csv', async (req, res) => {
  try {
    const leadsFile = path.join(__dirname, '../data/leads/leads.json');
    
    try {
      const data = await fs.readFile(leadsFile, 'utf8');
      const leads = JSON.parse(data);
      
      // Create CSV content
      const headers = [
        'ID', 'Name', 'Email', 'Phone', 'Business Type', 
        'Interest Level', 'Source', 'Status', 'Created At', 'Updated At'
      ];
      
      const csvRows = [headers.join(',')];
      
      leads.forEach(lead => {
        const row = [
          lead.id,
          `"${lead.name}"`,
          lead.email,
          lead.phone || '',
          lead.business_type,
          lead.interest_level,
          lead.source,
          lead.status,
          lead.created_at,
          lead.updated_at
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'No leads found'
      });
    }
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
