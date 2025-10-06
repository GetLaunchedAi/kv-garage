/**
 * Admin Dashboard System
 * Handles admin authentication, dashboard management, and admin tools
 */

// Dynamic API base URL - works for both development and production
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

export class AdminDashboard {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Refresh dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }

        // Manifest upload form
        const manifestForm = document.getElementById('manifest-upload-form');
        if (manifestForm) {
            manifestForm.addEventListener('submit', (e) => this.handleManifestUpload(e));
        }

        // Close modals on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async checkAuthentication() {
        // Wait for auth service to be available and ready
        if (typeof window.authService === 'undefined' || !window.authService.isReady()) {
            setTimeout(() => this.checkAuthentication(), 100);
            return;
        }
        
        if (window.authService.isLoggedIn()) {
            this.isAuthenticated = true;
            this.authToken = window.authService.getToken();
            this.showDashboard();
            await this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const loginBtn = e.target.querySelector('.login-btn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            if (typeof window.authService === 'undefined' || !window.authService.isReady()) {
                throw new Error('Authentication service not available');
            }
            
            const result = await window.authService.login(email, password);
            
            if (result.success) {
                this.isAuthenticated = true;
                this.authToken = window.authService.getToken();
                this.showDashboard();
                await this.loadDashboardData();
                this.showNotification('Login successful!', 'success');
            } else {
                throw new Error(result.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(`Login failed: ${error.message}`, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }

    handleLogout() {
        window.authService.logout();
        this.isAuthenticated = false;
        this.authToken = null;
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    clearAuth() {
        this.authToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('admin_token');
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
    }

    async loadDashboardData() {
        if (!this.isAuthenticated) return;

        try {
            // Load dashboard stats
            const statsResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateDashboardStats(stats.data);
            }

            // Load recent activity
            await this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-packs').textContent = stats.totalPacks || 0;
        document.getElementById('total-revenue').textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        document.getElementById('total-orders').textContent = stats.totalOrders || 0;
        document.getElementById('pending-orders').textContent = stats.pendingOrders || 0;
    }

    async loadRecentActivity() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/analytics?period=7`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderRecentActivity(data.data);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    renderRecentActivity(analytics) {
        const activityList = document.getElementById('activity-list');
        
        // If no analytics data or recent orders, show a simple message
        if (!analytics) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        // Create activity items from available data
        const activities = [];
        
        // Add top selling packs as activity items
        if (analytics.topSellingPacks && analytics.topSellingPacks.length > 0) {
            analytics.topSellingPacks.slice(0, 3).forEach(pack => {
                activities.push(`
                    <div class="activity-item">
                        <div class="activity-icon">📦</div>
                        <div class="activity-content">
                            <h4>Top Seller: ${pack.name}</h4>
                            <p>Sales: ${pack.sales} • Revenue: $${pack.revenue.toFixed(2)}</p>
                        </div>
                        <div class="activity-time">
                            <span>Recent</span>
                        </div>
                    </div>
                `);
            });
        }

        // Add revenue summary
        if (analytics.totalRevenue) {
            activities.push(`
                <div class="activity-item">
                    <div class="activity-icon">💰</div>
                    <div class="activity-content">
                        <h4>Period Summary</h4>
                        <p>Total Revenue: $${analytics.totalRevenue.toFixed(2)} • Orders: ${analytics.totalOrders}</p>
                    </div>
                    <div class="activity-time">
                        <span>Last 7 days</span>
                    </div>
                </div>
            `);
        }

        activityList.innerHTML = activities.length > 0 ? activities.join('') : '<p class="no-data">No recent activity</p>';
    }

    async openManifestUpload() {
        if (!this.isAuthenticated) return;

        try {
            // Load packs for selection
            const response = await fetch(`${API_BASE_URL}/packs`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.populatePackSelect(data.packs || data.data);
            }

            document.getElementById('manifest-upload-modal').style.display = 'flex';
            document.body.style.overflow = 'hidden';

        } catch (error) {
            console.error('Error loading packs:', error);
            this.showNotification('Failed to load packs', 'error');
        }
    }

    populatePackSelect(packs) {
        const select = document.getElementById('pack-select');
        select.innerHTML = '<option value="">Choose a pack...</option>';
        
        packs.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.id;
            option.textContent = pack.name;
            select.appendChild(option);
        });
    }

    closeManifestUpload() {
        document.getElementById('manifest-upload-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('manifest-upload-form').reset();
    }

    async handleManifestUpload(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) return;

        const formData = new FormData(e.target);
        const packId = formData.get('pack_id');
        const file = formData.get('manifest');

        if (!packId || !file) {
            this.showNotification('Please select a pack and upload a file', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        try {
            const uploadData = new FormData();
            uploadData.append('pack_id', packId);
            uploadData.append('manifest', file);

            const response = await fetch(`${API_BASE_URL}/admin/manifests/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: uploadData
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Manifest uploaded successfully!', 'success');
                this.closeManifestUpload();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                throw new Error(data.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Manifest upload error:', error);
            this.showNotification(`Upload failed: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Manifest';
        }
    }

    async openCustomPackRequests() {
        if (!this.isAuthenticated) return;

        const requestsList = document.getElementById('custom-requests-list');
        requestsList.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading custom requests...</p>
            </div>
        `;

        document.getElementById('custom-requests-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`${API_BASE_URL}/custom-packs/requests`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderCustomRequests(data.data);
            } else {
                throw new Error('Failed to load custom requests');
            }

        } catch (error) {
            console.error('Error loading custom requests:', error);
            requestsList.innerHTML = '<p class="error-message">Failed to load custom requests</p>';
        }
    }

    renderCustomRequests(requests) {
        const requestsList = document.getElementById('custom-requests-list');
        
        if (!requests || requests.length === 0) {
            requestsList.innerHTML = '<p class="no-data">No custom pack requests</p>';
            return;
        }

        const requestsHtml = requests.map(request => {
            const date = new Date(request.created_at).toLocaleDateString();
            const statusClass = `status-${request.status}`;
            
            return `
                <div class="request-item">
                    <div class="request-header">
                        <h4>${request.customer_name || 'Anonymous'}</h4>
                        <span class="request-date">${date}</span>
                        <span class="status-badge ${statusClass}">${request.status}</span>
                    </div>
                    <div class="request-content">
                        <p><strong>Email:</strong> ${request.customer_email}</p>
                        <p><strong>Business:</strong> ${request.business_name || 'N/A'}</p>
                        <p><strong>Request:</strong> ${request.request_description || request.requested_mix || 'N/A'}</p>
                        <p><strong>Budget:</strong> $${request.estimated_budget || 'N/A'}</p>
                        ${request.admin_notes ? `<p><strong>Admin Notes:</strong> ${request.admin_notes}</p>` : ''}
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-sm btn-primary" onclick="updateRequestStatus('${request.id}', 'reviewed')">
                            Mark Reviewed
                        </button>
                        <button class="btn btn-sm btn-success" onclick="updateRequestStatus('${request.id}', 'approved')">
                            Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="updateRequestStatus('${request.id}', 'rejected')">
                            Reject
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        requestsList.innerHTML = requestsHtml;
    }

    closeCustomPackRequests() {
        document.getElementById('custom-requests-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async updateRequestStatus(requestId, status) {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch(`${API_BASE_URL}/custom-packs/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showNotification(`Request ${status} successfully!`, 'success');
                this.openCustomPackRequests(); // Refresh the list
            } else {
                throw new Error('Failed to update request status');
            }

        } catch (error) {
            console.error('Error updating request status:', error);
            this.showNotification('Failed to update request status', 'error');
        }
    }

    closeAllModals() {
        this.closeManifestUpload();
        this.closeCustomPackRequests();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '400px',
            wordWrap: 'break-word',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Global functions for onclick handlers
window.openManifestUpload = function() {
    if (window.adminDashboard) {
        window.adminDashboard.openManifestUpload();
    }
};

window.closeManifestUpload = function() {
    if (window.adminDashboard) {
        window.adminDashboard.closeManifestUpload();
    }
};

window.openCustomPackRequests = function() {
    if (window.adminDashboard) {
        window.adminDashboard.openCustomPackRequests();
    }
};

window.closeCustomPackRequests = function() {
    if (window.adminDashboard) {
        window.adminDashboard.closeCustomPackRequests();
    }
};

window.updateRequestStatus = function(requestId, status) {
    if (window.adminDashboard) {
        window.adminDashboard.updateRequestStatus(requestId, status);
    }
};
