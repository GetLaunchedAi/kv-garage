/**
 * Admin Dashboard System
 * Handles admin authentication, dashboard management, and admin tools
 */

// API Configuration - using global API_BASE_URL from shared-admin-auth.js
const JSON_DATA_URL = '/data'; // Fallback for static data


try {
class AdminDashboard {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        // Initialize asynchronously
        this.init().catch(error => {
            console.error('AdminDashboard initialization error:', error);
        });
    }

    async init() {
        this.bindEvents();
        // Wait for SharedAdminAuth to be ready before checking authentication
        await this.waitForSharedAuth();
        await this.checkAuthentication();
    }

    async waitForSharedAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.sharedAdminAuth) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 50);
                }
            };
            checkAuth();
        });
    }

    bindEvents() {
        try {
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
                refreshBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    refreshBtn.disabled = true;
                    refreshBtn.textContent = 'Refreshing...';
                    
                    try {
                        window.location.reload();
                    } catch (error) {
                        console.error('Refresh error:', error);
                        this.showNotification('Failed to refresh dashboard', 'error');
                    } finally {
                        refreshBtn.disabled = false;
                        refreshBtn.textContent = 'Refresh';
                    }
                });
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
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    async checkAuthentication() {
        try {
            // Use shared authentication system with persistent login
            if (window.sharedAdminAuth) {
                // Try to auto-login from stored token (now async with refresh capability)
                const autoLoginSuccess = await window.sharedAdminAuth.shouldAutoLogin();
                
                if (autoLoginSuccess && window.sharedAdminAuth.isLoggedIn()) {
                    this.isAuthenticated = true;
                    this.authToken = window.sharedAdminAuth.getToken();
                    this.showDashboard();
                    await this.loadDashboardData();
                    return;
                }
            }
            
            // No valid stored token, show login form
            this.showLogin();
        } catch (error) {
            console.error('Authentication check error:', error);
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
            // Use shared authentication system
            if (window.sharedAdminAuth) {
                const result = await window.sharedAdminAuth.login(email, password);
            if (result.success) {
                this.isAuthenticated = true;
                    this.authToken = result.token;
                this.showDashboard();
                await this.loadDashboardData();
                this.showNotification('Login successful!', 'success');
                } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error('Authentication system not available');
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
        // Use shared authentication system
        if (window.sharedAdminAuth) {
            window.sharedAdminAuth.logout();
        }
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
            // Get real dashboard stats from API
            const stats = await this.getRealDashboardStats();
            this.updateDashboardStats(stats);

            // Load recent activity
            await this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async getRealDashboardStats() {
        try {
            
            // Fetch real orders data
            const ordersResponse = await fetch(`${window.API_BASE_URL}/orders?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let ordersData = { orders: [], stats: {} };
            if (ordersResponse.ok) {
                ordersData = await ordersResponse.json();
            }
            
            // Fetch packs data for pack-related stats
            const packsResponse = await fetch(`${window.API_BASE_URL}/packs`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let packsData = { packs: [] };
            if (packsResponse.ok) {
                packsData = await packsResponse.json();
            }
            
            const orders = ordersData.orders || [];
            const packs = packsData.packs || [];
            
            // Calculate real stats from actual data
            const stats = {
                total_packs: packs.length,
                active_packs: packs.filter(p => p.status === 'active').length,
                total_revenue: orders.reduce((sum, order) => sum + (order.total_amount || order.amount || 0), 0),
                total_units: packs.reduce((sum, p) => sum + (p.units || 0), 0),
                total_orders: orders.length,
                pending_orders: orders.filter(o => o.status === 'pending').length
            };
            
            return stats;
            
        } catch (error) {
            console.error('Error fetching real dashboard stats:', error);
            // Return empty stats if API fails
            return {
                total_packs: 0,
                active_packs: 0,
                total_revenue: 0,
                total_units: 0,
                total_orders: 0,
                pending_orders: 0
            };
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-packs').textContent = stats.total_packs || 0;
        document.getElementById('total-revenue').textContent = `$${(stats.total_revenue || 0).toFixed(2)}`;
        document.getElementById('total-orders').textContent = stats.total_orders || 0;
        document.getElementById('pending-orders').textContent = stats.pending_orders || 0;
    }

    async loadRecentActivity() {
        try {
            
            // Load real recent activity from API
            const response = await fetch(`${window.API_BASE_URL}/activity/recent?limit=10&days=7`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            
            if (response.ok) {
                const data = await response.json();
                this.renderRecentActivity(data.activities || []);
            } else {
                const errorData = await response.json();
                console.error('Activity fetch error:', errorData);
                throw new Error(`Failed to load recent activity: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            // Show fallback message
            const activityList = document.getElementById('activity-list');
            if (activityList) {
                activityList.innerHTML = '<p class="no-data">No recent activity available</p>';
            }
        }
    }

    renderRecentActivity(activities) {
        const activityList = document.getElementById('activity-list');
        
        // If no activities, show a simple message
        if (!activities || activities.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        // Create activity items from real activity data
        const activitiesHtml = activities.map(activity => {
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const activityIcon = this.getActivityIcon(activity.type);
            const activityClass = this.getActivityClass(activity.type);
            
            return `
                <div class="activity-item ${activityClass}">
                    <div class="activity-icon">${activityIcon}</div>
                    <div class="activity-content">
                        <p class="activity-message">${activity.description}</p>
                        <div class="activity-meta">
                            <span class="activity-user">${activity.user}</span>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        activityList.innerHTML = activitiesHtml;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    getActivityIcon(type) {
        const icons = {
            'order_created': '🛒',
            'order_status_changed': '📋',
            'order_updated': '✏️',
            'order_cancelled': '❌',
            'pack_created': '📦',
            'pack_updated': '📦',
            'pack_deleted': '🗑️',
            'manifest_uploaded': '📄',
            'manifest_processed': '✅',
            'custom_request_created': '🎯',
            'custom_request_status_changed': '🔄',
            'custom_request_reviewed': '👀',
            'custom_request_approved': '✅',
            'custom_request_rejected': '❌',
            'admin_action': '⚙️',
            'system_action': '🔧'
        };
        return icons[type] || '📝';
    }

    getActivityClass(type) {
        const classes = {
            'order_created': 'activity-order',
            'order_status_changed': 'activity-order',
            'order_updated': 'activity-order',
            'order_cancelled': 'activity-order-cancelled',
            'pack_created': 'activity-pack',
            'pack_updated': 'activity-pack',
            'pack_deleted': 'activity-pack-deleted',
            'manifest_uploaded': 'activity-manifest',
            'manifest_processed': 'activity-manifest',
            'custom_request_created': 'activity-request',
            'custom_request_status_changed': 'activity-request',
            'custom_request_reviewed': 'activity-request',
            'custom_request_approved': 'activity-request-approved',
            'custom_request_rejected': 'activity-request-rejected',
            'admin_action': 'activity-admin',
            'system_action': 'activity-system'
        };
        return classes[type] || 'activity-default';
    }

    async openManifestUpload() {
        if (!this.isAuthenticated) return;

        try {
            // Load packs for selection
            const response = await fetch(`${window.API_BASE_URL}/packs`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.populatePackSelect(data.packs || data.data);
            }

            const modal = document.getElementById('manifest-upload-modal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.style.overflow = 'hidden';
            }

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
        const modal = document.getElementById('manifest-upload-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
        const form = document.getElementById('manifest-upload-form');
        if (form) {
            form.reset();
        }
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

            const response = await fetch(`${window.API_BASE_URL}/manifests/upload`, {
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

        document.getElementById('custom-requests-modal').classList.add('show');
        document.body.style.overflow = 'hidden';

        try {
            // Load real custom requests from API
            const response = await fetch(`${window.API_BASE_URL}/custom-requests?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.renderCustomRequests(data.requests || []);
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
                        ${request.customer_phone ? `<p><strong>Phone:</strong> ${request.customer_phone}</p>` : ''}
                        ${request.business_name ? `<p><strong>Business:</strong> ${request.business_name}</p>` : ''}
                        ${request.estimated_budget ? `<p><strong>Budget:</strong> $${request.estimated_budget}</p>` : ''}
                        ${request.preferred_categories ? `<p><strong>Categories:</strong> ${request.preferred_categories}</p>` : ''}
                        <p><strong>Description:</strong> ${request.request_description}</p>
                        ${request.admin_notes ? `<p><strong>Admin Notes:</strong> ${request.admin_notes}</p>` : ''}
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-sm btn-primary" onclick="updateRequestStatus('${request.id}', 'reviewed')" title="Mark as reviewed">
                            Mark Reviewed
                        </button>
                        <button class="btn btn-sm btn-success" onclick="updateRequestStatus('${request.id}', 'approved')" title="Approve request">
                            Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="updateRequestStatus('${request.id}', 'rejected')" title="Reject request">
                            Reject
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        requestsList.innerHTML = requestsHtml;
    }

    closeCustomPackRequests() {
        document.getElementById('custom-requests-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    async updateRequestStatus(requestId, status) {
        if (!this.isAuthenticated) {
            this.showNotification('Please log in to update request status', 'error');
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/custom-requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showNotification(`Request ${status} successfully!`, 'success');
                this.openCustomPackRequests(); // Refresh the list
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update request status');
            }

        } catch (error) {
            console.error('Error updating request status:', error);
            this.showNotification(`Failed to update request status: ${error.message}`, 'error');
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
    } else {
        console.error('AdminDashboard not available. Please refresh the page.');
        alert('AdminDashboard not available. Please refresh the page.');
    }
};


// Make AdminDashboard globally available
window.AdminDashboard = AdminDashboard;

} catch (error) {
    console.error('Error defining AdminDashboard class:', error);
}
