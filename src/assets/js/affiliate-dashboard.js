/**
 * Affiliate Dashboard Functionality
 * Handles authentication, data display, link generation, and earnings tracking
 */

(function() {
  'use strict';

  class AffiliateDashboard {
    constructor() {
      this.currentAffiliate = null;
      this.isAuthenticated = false;
      this.baseUrl = window.location.origin;
      this.init();
    }

    init() {
      this.checkAuthentication();
      this.setupEventListeners();
    }

    /**
     * Check if affiliate is authenticated
     */
    checkAuthentication() {
      const affiliateData = localStorage.getItem('affiliate_data');
      const affiliateToken = localStorage.getItem('affiliate_token');
      const tokenExpiry = localStorage.getItem('affiliate_token_expiry');

      if (affiliateData && affiliateToken && tokenExpiry) {
        const expiry = parseInt(tokenExpiry);
        if (Date.now() < expiry) {
          this.currentAffiliate = JSON.parse(affiliateData);
          this.isAuthenticated = true;
          this.showDashboard();
          this.loadDashboardData();
        } else {
          this.logout();
        }
      } else {
        this.showLogin();
      }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Login form
      const loginForm = document.getElementById('affiliate-login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
      }

      // Logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }

      // Refresh button
      const refreshBtn = document.getElementById('refresh-dashboard');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.loadDashboardData());
      }

      // Tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.target.dataset.tab;
          this.switchTab(tab);
        });
      });

      // Link generation
      const generateLinkBtn = document.getElementById('generate-link');
      if (generateLinkBtn) {
        generateLinkBtn.addEventListener('click', () => this.generateLink());
      }

      const linkTypeSelect = document.getElementById('link-type');
      if (linkTypeSelect) {
        linkTypeSelect.addEventListener('change', (e) => {
          const customUrlGroup = document.getElementById('custom-url-group');
          if (e.target.value === 'custom') {
            customUrlGroup.style.display = 'block';
          } else {
            customUrlGroup.style.display = 'none';
          }
        });
      }

      // Copy link button
      const copyLinkBtn = document.getElementById('copy-link-btn');
      if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => this.copyLink());
      }

      // Profile form
      const profileForm = document.getElementById('profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
      }

      // Payout form
      const payoutForm = document.getElementById('payout-form');
      if (payoutForm) {
        payoutForm.addEventListener('submit', (e) => this.handlePayoutSettings(e));
      }

      // Request payout button
      const requestPayoutBtn = document.getElementById('request-payout-btn');
      if (requestPayoutBtn) {
        requestPayoutBtn.addEventListener('click', () => this.requestPayout());
      }
    }

    /**
     * Handle login
     */
    async handleLogin(e) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');

      const loginBtn = e.target.querySelector('.login-btn');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';

      try {
        // Load affiliates data
        const affiliatesData = this.loadAffiliatesData();
        
        // Find affiliate by email
        const affiliate = affiliatesData.affiliates.find(a => a.email === email);
        
        if (!affiliate) {
          throw new Error('Invalid email or password. Please check your credentials or apply to become an affiliate.');
        }

        // For demo purposes, accept any password if affiliate exists
        // In production, this would be a proper authentication check
        if (affiliate.status !== 'approved') {
          throw new Error('Your affiliate account is pending approval. Please wait for approval email.');
        }

        // Set authentication
        this.currentAffiliate = affiliate;
        this.isAuthenticated = true;
        
        const token = 'affiliate_token_' + Date.now();
        const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        
        localStorage.setItem('affiliate_token', token);
        localStorage.setItem('affiliate_token_expiry', expiry.toString());
        localStorage.setItem('affiliate_data', JSON.stringify(affiliate));

        this.showDashboard();
        await this.loadDashboardData();
        
      } catch (error) {
        alert(error.message || 'Login failed. Please try again.');
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    }

    /**
     * Show login form
     */
    showLogin() {
      document.getElementById('login-section').style.display = 'flex';
      document.getElementById('dashboard-section').style.display = 'none';
    }

    /**
     * Show dashboard
     */
    showDashboard() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
      
      if (this.currentAffiliate) {
        document.getElementById('affiliate-id-display').textContent = this.currentAffiliate.id || 'N/A';
        this.populateProfileForm();
      }
    }

    /**
     * Logout
     */
    logout() {
      localStorage.removeItem('affiliate_token');
      localStorage.removeItem('affiliate_token_expiry');
      localStorage.removeItem('affiliate_data');
      this.currentAffiliate = null;
      this.isAuthenticated = false;
      this.showLogin();
    }

    /**
     * Load affiliates data from JSON
     */
    loadAffiliatesData() {
      try {
        // Try to load from localStorage first (for demo)
        const stored = localStorage.getItem('affiliates_data');
        if (stored) {
          return JSON.parse(stored);
        }
        
        // Fallback to default structure
        return {
          affiliates: [],
          applications: [],
          commissions: [],
          payouts: [],
          settings: {
            commissionRates: {
              packs: 0.10,
              mentorship: 0.20,
              bonusPercent: 0.05,
              topPerformerThreshold: 0.10
            },
            payout: {
              minimum: 100,
              frequency: 'monthly',
              method: 'stripe_connect'
            },
            cookieDuration: 30,
            currency: 'USD'
          }
        };
      } catch (error) {
        return { affiliates: [], commissions: [], payouts: [] };
      }
    }

    /**
     * Save affiliates data to localStorage
     */
    saveAffiliatesData(data) {
      localStorage.setItem('affiliates_data', JSON.stringify(data));
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
      if (!this.currentAffiliate) return;

      const data = this.loadAffiliatesData();
      const affiliateId = this.currentAffiliate.id;

      // Filter commissions for this affiliate
      const commissions = (data.commissions || []).filter(c => c.affiliateId === affiliateId);
      const payouts = (data.payouts || []).filter(p => p.affiliateId === affiliateId);

      // Calculate stats
      const totalEarnings = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const pendingEarnings = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      const totalReferrals = commissions.length;
      const conversions = commissions.filter(c => c.status !== 'cancelled').length;
      const conversionRate = totalReferrals > 0 ? (conversions / totalReferrals * 100).toFixed(1) : 0;

      // Update UI
      document.getElementById('total-earnings').textContent = '$' + totalEarnings.toFixed(2);
      document.getElementById('pending-earnings').textContent = '$' + pendingEarnings.toFixed(2);
      document.getElementById('total-referrals').textContent = totalReferrals;
      document.getElementById('conversions').textContent = conversions;
      document.getElementById('conversion-rate').textContent = conversionRate + '%';
      document.getElementById('available-balance').textContent = pendingEarnings.toFixed(2);
      document.getElementById('total-paid').textContent = totalEarnings.toFixed(2);
      document.getElementById('pending-commissions').textContent = pendingEarnings.toFixed(2);

      // Enable/disable payout button
      const payoutBtn = document.getElementById('request-payout-btn');
      if (payoutBtn) {
        payoutBtn.disabled = pendingEarnings < 100;
      }

      // Load earnings table
      this.populateEarningsTable(commissions);

      // Load recent activity
      this.populateRecentActivity(commissions);

      // Load top links
      this.populateTopLinks(commissions);
    }

    /**
     * Populate earnings table
     */
    populateEarningsTable(commissions) {
      const tbody = document.getElementById('earnings-table-body');
      if (!tbody) return;

      if (commissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No earnings yet. Start referring customers!</td></tr>';
        return;
      }

      tbody.innerHTML = commissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(commission => `
          <tr>
            <td>${new Date(commission.date).toLocaleDateString()}</td>
            <td>${commission.type || 'Sale'}</td>
            <td>${commission.productName || 'N/A'}</td>
            <td>$${(commission.saleAmount || 0).toFixed(2)}</td>
            <td>${((commission.rate || 0) * 100).toFixed(0)}%</td>
            <td>$${(commission.amount || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${commission.status}">${commission.status}</span></td>
          </tr>
        `).join('');
    }

    /**
     * Populate recent activity
     */
    populateRecentActivity(commissions) {
      const container = document.getElementById('recent-activity');
      if (!container) return;

      if (commissions.length === 0) {
        container.innerHTML = '<p class="empty-state">No activity yet. Start sharing your links!</p>';
        return;
      }

      const recent = commissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      container.innerHTML = recent.map(commission => `
        <div class="activity-item">
          <div class="activity-text">
            ${commission.type || 'Sale'} - ${commission.productName || 'Product'}
          </div>
          <div class="activity-date">
            ${new Date(commission.date).toLocaleDateString()}
          </div>
        </div>
      `).join('');
    }

    /**
     * Populate top links
     */
    populateTopLinks(commissions) {
      const container = document.getElementById('top-links');
      if (!container) return;

      // Group by link/path
      const linkStats = {};
      commissions.forEach(c => {
        const path = c.referralPath || 'homepage';
        if (!linkStats[path]) {
          linkStats[path] = { path, count: 0, earnings: 0 };
        }
        linkStats[path].count++;
        linkStats[path].earnings += (c.amount || 0);
      });

      const topLinks = Object.values(linkStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (topLinks.length === 0) {
        container.innerHTML = '<p class="empty-state">No links generated yet. Create your first link!</p>';
        return;
      }

      container.innerHTML = topLinks.map(link => `
        <div class="link-item">
          <div class="link-info">
            <div class="link-url">${this.baseUrl}${link.path === 'homepage' ? '/' : '/' + link.path}</div>
            <div class="link-stats">${link.count} referrals • $${link.earnings.toFixed(2)} earned</div>
          </div>
        </div>
      `).join('');
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
          btn.classList.add('active');
        }
      });

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + '-tab') {
          content.classList.add('active');
        }
      });
    }

    /**
     * Generate affiliate link
     */
    generateLink() {
      if (!this.currentAffiliate) {
        alert('Please log in first.');
        return;
      }

      const linkType = document.getElementById('link-type').value;
      const customUrl = document.getElementById('custom-url').value;
      const affiliateId = this.currentAffiliate.id;

      let path = '/';
      if (linkType === 'packs') path = '/packs/';
      else if (linkType === 'mentorship') path = '/mentorship-consulting/';
      else if (linkType === 'shop') path = '/shop/';
      else if (linkType === 'custom' && customUrl) path = customUrl.startsWith('/') ? customUrl : '/' + customUrl;

      const affiliateLink = `${this.baseUrl}${path}?ref=${affiliateId}`;
      
      // Display generated link
      document.getElementById('affiliate-link-output').value = affiliateLink;
      document.getElementById('generated-link-display').style.display = 'block';

      // Add to all links list
      this.addLinkToList(affiliateLink, path);
    }

    /**
     * Add link to list
     */
    addLinkToList(link, path) {
      const container = document.getElementById('all-links-list');
      if (!container) return;

      if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
      }

      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      linkItem.innerHTML = `
        <div class="link-info">
          <div class="link-url">${link}</div>
          <div class="link-stats">0 clicks • 0 conversions</div>
        </div>
        <div class="link-actions">
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${link}')">Copy</button>
        </div>
      `;
      
      container.insertBefore(linkItem, container.firstChild);
    }

    /**
     * Copy link to clipboard
     */
    async copyLink() {
      const linkInput = document.getElementById('affiliate-link-output');
      if (linkInput) {
        linkInput.select();
        try {
          await navigator.clipboard.writeText(linkInput.value);
          alert('Link copied to clipboard!');
        } catch (err) {
          // Fallback for older browsers
          document.execCommand('copy');
          alert('Link copied to clipboard!');
        }
      }
    }

    /**
     * Populate profile form
     */
    populateProfileForm() {
      if (!this.currentAffiliate) return;

      const nameInput = document.getElementById('settings-name');
      const emailInput = document.getElementById('settings-email');
      const phoneInput = document.getElementById('settings-phone');

      if (nameInput) nameInput.value = this.currentAffiliate.name || '';
      if (emailInput) emailInput.value = this.currentAffiliate.email || '';
      if (phoneInput) phoneInput.value = this.currentAffiliate.phone || '';
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate(e) {
      e.preventDefault();
      // TODO: Implement profile update
      alert('Profile update functionality will be implemented with backend integration.');
    }

    /**
     * Handle payout settings
     */
    async handlePayoutSettings(e) {
      e.preventDefault();
      // TODO: Implement payout settings update
      alert('Payout settings update functionality will be implemented with backend integration.');
    }

    /**
     * Request payout
     */
    async requestPayout() {
      if (!this.currentAffiliate) return;

      const data = this.loadAffiliatesData();
      const pendingCommissions = (data.commissions || [])
        .filter(c => c.affiliateId === this.currentAffiliate.id && c.status === 'pending');
      
      const totalPending = pendingCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

      if (totalPending < 100) {
        alert('Minimum payout is $100. Your current balance is $' + totalPending.toFixed(2));
        return;
      }

      if (confirm(`Request payout of $${totalPending.toFixed(2)}? This will be processed within 5-7 business days.`)) {
        // TODO: Implement payout request
        alert('Payout request functionality will be implemented with Stripe Connect integration.');
      }
    }
  }

  // Initialize dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.affiliateDashboard = new AffiliateDashboard();
    });
  } else {
    window.affiliateDashboard = new AffiliateDashboard();
  }

})();

