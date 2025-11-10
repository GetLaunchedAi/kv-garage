/**
 * Admin Dashboard System
 * Handles admin authentication, dashboard management, and admin tools
 */

// Using JSON data instead of API
const JSON_DATA_URL = '/data';
const API_BASE_URL = '/api'; // Fallback for API calls


try {
class AdminDashboard {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.packs = []; // Store packs for manifest upload
        this.init();
    }

    init() {
        this.bindEvents();
        // Delay authentication check to ensure sharedAdminAuth is available
        setTimeout(() => {
            this.checkAuthentication();
        }, 100);
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
        } catch (error) {
        }
    }

    async checkAuthentication() {
        try {
            // Use shared authentication system with persistent login
            if (window.sharedAdminAuth) {
                // Try to auto-login from stored token
                const autoLoginSuccess = window.sharedAdminAuth.shouldAutoLogin();
                
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
                const result = window.sharedAdminAuth.login(email, password);
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
            // Load pack data from JSON
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);
            if (response.ok) {
                const data = await response.json();
                this.packs = data.packs || []; // Store packs for manifest upload
                
                // Create mock dashboard stats
                const stats = {
                    total_packs: this.packs.length,
                    active_packs: this.packs.filter(p => p.status === 'active').length,
                    total_revenue: this.packs.reduce((sum, p) => sum + (p.price || 0), 0),
                    total_units: this.packs.reduce((sum, p) => sum + (p.units || 0), 0),
                    total_orders: Math.floor(Math.random() * 50) + 10, // Mock orders
                    pending_orders: Math.floor(Math.random() * 5) + 1 // Mock pending orders
                };
                
                this.updateDashboardStats(stats);
            }

            // Load recent activity
            await this.loadRecentActivity();

        } catch (error) {
            this.showNotification('Failed to load dashboard data', 'error');
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
            // Load recent activity from JSON data (mock data for now)
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);
            
            if (response.ok) {
                const data = await response.json();
                // Create mock recent activity from packs data
                const mockActivity = {
                    recent_orders: data.packs ? data.packs.slice(0, 5).map((pack, index) => ({
                        id: `ORD-${1000 + index}`,
                        customer_name: `Customer ${index + 1}`,
                        pack_name: pack.name,
                        amount: pack.price,
                        status: ['pending', 'completed', 'shipped'][index % 3],
                        created_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString()
                    })) : []
                };
                this.renderRecentActivity(mockActivity);
            }
        } catch (error) {
            // Show fallback message
            const activityList = document.getElementById('activity-list');
            if (activityList) {
                activityList.innerHTML = '<p class="no-data">No recent activity available</p>';
            }
        }
    }

    renderRecentActivity(analytics) {
        const activityList = document.getElementById('activity-list');
        
        // If no analytics data or recent orders, show a simple message
        if (!analytics) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        // Create activity items from recent orders
        if (analytics.recent_orders && analytics.recent_orders.length > 0) {
            const activitiesHtml = analytics.recent_orders.map(order => {
                const statusClass = `status-${order.status}`;
                const timeAgo = this.getTimeAgo(new Date(order.created_at));
                
                return `
                    <div class="activity-item">
                        <div class="activity-content">
                            <p class="activity-message">New order from ${order.customer_name}</p>
                            <p class="activity-details">Order #${order.id} - ${order.pack_name} - $${order.amount}</p>
                            <div class="activity-meta">
                                <span class="status-badge ${statusClass}">${order.status}</span>
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            activityList.innerHTML = activitiesHtml;
        } else {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    async openManifestUpload() {
        if (!this.isAuthenticated) return;

        // Always ensure packs are loaded (reload to get latest data)
        try {
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch packs: ${response.status}`);
            }
            const data = await response.json();
            this.packs = data.packs || [];
            
            if (this.packs.length === 0) {
                this.showNotification('No packs available. Please create a pack first.', 'error');
                return;
            }
        } catch (error) {
            console.error('Error loading packs:', error);
            this.showNotification('Failed to load packs: ' + error.message, 'error');
            return;
        }

        // Populate pack select
        const select = document.getElementById('pack-select');
        if (!select) {
            console.error('Pack select element not found');
            this.showNotification('Error: Pack select element not found', 'error');
            return;
        }

        this.populatePackSelect(this.packs);

        const modal = document.getElementById('manifest-upload-modal');
        if (!modal) {
            console.error('Manifest upload modal not found');
            return;
        }
        
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    populatePackSelect(packs, selectedPackId = null) {
        const select = document.getElementById('pack-select');
        if (!select) {
            console.error('Pack select element not found in populatePackSelect');
            return;
        }
        
        select.innerHTML = '<option value="">Choose a pack...</option>';
        
        if (!packs || packs.length === 0) {
            console.warn('No packs provided to populatePackSelect');
            return;
        }
        
        packs.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.id;
            option.textContent = pack.name || `Pack ${pack.id}`;
            if (selectedPackId && pack.id === selectedPackId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        console.log(`Populated pack select with ${packs.length} packs`);
    }

    closeManifestUpload() {
        const modal = document.getElementById('manifest-upload-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            const form = document.getElementById('manifest-upload-form');
            if (form) form.reset();
        }, 300);
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

            // Detect if we're in development (localhost) and use PHP server, otherwise use relative path
            const MANIFESTS_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8000/api/save-manifests.php'
                : '/api/save-manifests.php';

            const response = await fetch(MANIFESTS_API_URL, {
                method: 'POST',
                body: uploadData
            });

            // Get response text first to handle non-JSON responses
            const responseText = await response.text();
            let data;
            
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                // If response is not valid JSON, it might contain PHP errors
                console.error('Invalid JSON response:', responseText);
                throw new Error('Server returned an invalid response. Please check the server logs.');
            }

            if (response.ok && data.success) {
                this.showNotification('Manifest uploaded successfully!', 'success');
                this.closeManifestUpload();
                // Refresh dashboard data
                this.loadDashboardData();
            } else {
                throw new Error(data.error || data.message || 'Upload failed');
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
            // Load custom requests from JSON data (mock data for now)
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);
            
            if (response.ok) {
                const data = await response.json();
                // Create mock custom requests from packs data
                const mockRequests = data.packs ? data.packs.slice(0, 3).map((pack, index) => ({
                    id: `REQ-${2000 + index}`,
                    customer_name: `Customer ${index + 1}`,
                    customer_email: `customer${index + 1}@example.com`,
                    pack_name: pack.name,
                    custom_requirements: `Custom requirements for ${pack.name}`,
                    status: ['pending', 'in_review', 'completed'][index % 3],
                    created_at: new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000)).toISOString(),
                    estimated_value: pack.price * 1.2
                })) : [];
                
                this.renderCustomRequests(mockRequests);
            } else {
                throw new Error('Failed to load custom requests');
            }

        } catch (error) {
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
        document.getElementById('custom-requests-modal').classList.remove('show');
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
            zIndex: '99999999',
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

window.downloadManifestTemplate = function() {
    const link = document.createElement('a');
    link.href = '/assets/templates/manifest-template.csv';
    link.download = 'manifest-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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


// Make AdminDashboard globally available
window.AdminDashboard = AdminDashboard;

} catch (error) {
}
