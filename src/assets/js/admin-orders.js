/**
 * Admin Order Management System
 * Handles order viewing, status updates, and management
 */

// Use global environment detection from shared-admin-auth.js
// API_BASE_URL is now available globally from shared-admin-auth.js

// Environment logging
console.log(`🌍 Admin Orders - Using global environment detection`);
console.log(`🔗 API Base URL: ${window.API_BASE_URL}`);

class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.statusFilter = '';
        
        // Initialize asynchronously
        this.init().catch(error => {
            console.error('AdminOrderManager initialization error:', error);
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

    async checkAuthentication() {
        try {
            // Use shared authentication system with persistent login
            if (window.sharedAdminAuth) {
                // Try to auto-login from stored token (now async with refresh capability)
                const autoLoginSuccess = await window.sharedAdminAuth.shouldAutoLogin();
                
                if (autoLoginSuccess && window.sharedAdminAuth.isLoggedIn()) {
                    this.isAuthenticated = true;
                    this.showOrders();
                    this.loadOrders();
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

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('orders-section').style.display = 'none';
    }

    showOrders() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('orders-section').style.display = 'block';
    }

    getAuthToken() {
        return window.authService ? window.authService.getToken() : localStorage.getItem('admin_token');
    }

    bindEvents() {
        // Login form
        document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-orders');
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
                    this.showNotification('Failed to refresh orders', 'error');
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.textContent = 'Refresh';
                }
            });
        }

        // Status filter
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.currentPage = 1;
            this.loadOrders();
        });

        // Back to dashboard button
        document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
            window.location.href = '/admin/dashboard/';
        });

        // Close modal on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeOrderModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeOrderModal();
            }
        });
    }

    async loadOrders() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });
            
            if (this.statusFilter) {
                params.append('status', this.statusFilter);
            }

            // Load orders from the real API
            const url = `${window.API_BASE_URL}/orders?${params.toString()}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Use real orders from API
                this.orders = data.orders || [];
                
                this.renderOrders();
                this.updateStats();
                this.renderPagination();
                
            } else {
                throw new Error(data.error || 'Failed to load orders');
            }
            
        } catch (error) {
            console.error('Error loading orders:', error);
            if (error.message.includes('401') || error.message.includes('403')) {
                this.showError('Authentication failed. Please log in again.');
                // Clear token and show login
                localStorage.removeItem('admin_token');
                this.showLogin();
            } else {
                this.showError(`Failed to load orders: ${error.message}`);
            }
        }
    }

    showLoading() {
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    <div class="loading-spinner"></div>
                    Loading orders...
                </td>
            </tr>
        `;
    }

    showError(message) {
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    <p style="color: #ef4444;">${message}</p>
                    <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
                </td>
            </tr>
        `;
    }

    renderOrders() {
        const tbody = document.getElementById('orders-table-body');
        
        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-row">
                        <p>No orders found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.orders.map(order => this.createOrderRow(order)).join('');
        
        // Bind row click events
        tbody.querySelectorAll('.order-row').forEach(row => {
            row.addEventListener('click', () => {
                const orderId = row.dataset.orderId;
                this.showOrderDetails(orderId);
            });
        });
    }

    createOrderRow(order) {
        const statusClass = `status-${order.status}`;
        const statusLabel = this.getStatusLabel(order.status);
        const paymentMode = order.payment_mode === 'full' ? 'Full Payment' : '70% Deposit';
        const paymentStatus = order.payment_status || 'unknown';
        const paymentStatusClass = `payment-${paymentStatus}`;
        
        return `
            <tr class="order-row" data-order-id="${order.id}" style="cursor: pointer;">
                <td>
                    <span class="order-id">${order.id.substring(0, 8)}...</span>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${order.customer_name || 'N/A'}</div>
                        <div class="customer-email">${order.customer_email || 'N/A'}</div>
                    </div>
                </td>
                <td>
                    <div class="pack-info">
                        <div class="pack-name">${order.pack_name || 'N/A'}</div>
                    </div>
                </td>
                <td>
                    <div class="payment-info">
                        <span class="payment-mode">${paymentMode}</span>
                        <div class="payment-status ${paymentStatusClass}">${paymentStatus}</div>
                        ${order.payment_intent_id ? `<div class="payment-id">${order.payment_intent_id.substring(0, 12)}...</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="amount-info">
                        <div class="amount-paid">$${(order.amount || 0).toFixed(2)}</div>
                        ${order.payment_mode === 'deposit' ? 
                            `<div class="remaining-amount">Remaining: $${((order.total_amount || 0) - (order.amount || 0)).toFixed(2)}</div>` : 
                            ''
                        }
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    <div class="date-info">
                        <div class="order-date">${this.formatDate(order.created_at)}</div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-primary" onclick="window.showOrderDetails('${order.id}')">
                            View
                        </button>
                        ${this.getStatusActionButtons(order)}
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusActionButtons(order) {
        const buttons = [];
        
        switch (order.status) {
            case 'pending':
                buttons.push(`
                    <button class="btn btn-sm btn-success" onclick="window.updateOrderStatus('${order.id}', 'reserved')">
                        Mark Reserved
                    </button>
                `);
                break;
            case 'reserved':
                buttons.push(`
                    <button class="btn btn-sm btn-success" onclick="window.updateOrderStatus('${order.id}', 'completed')">
                        Mark Completed
                    </button>
                `);
                break;
            case 'completed':
                buttons.push(`
                    <button class="btn btn-sm btn-warning" onclick="window.updateOrderStatus('${order.id}', 'shipped')">
                        Mark Shipped
                    </button>
                `);
                break;
        }
        
        if (order.status !== 'cancelled' && order.status !== 'shipped') {
            buttons.push(`
                <button class="btn btn-sm btn-danger" onclick="window.updateOrderStatus('${order.id}', 'cancelled')">
                    Cancel
                </button>
            `);
        }
        
        return buttons.join('');
    }

    getStatusLabel(status) {
        const statusLabels = {
            'pending': 'Pending',
            'reserved': 'Reserved',
            'completed': 'Completed',
            'shipped': 'Shipped',
            'cancelled': 'Cancelled'
        };
        return statusLabels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateStats() {
        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter(o => o.status === 'pending').length;
        const completedOrders = this.orders.filter(o => o.status === 'completed' || o.status === 'shipped').length;
        const totalRevenue = this.orders.reduce((sum, order) => sum + (order.amount_paid || order.amount || 0), 0);

        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('completed-orders').textContent = completedOrders;
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    }

    renderPagination() {
        // Simple pagination - in a real app, you'd get total count from the API
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.goToPage(${this.currentPage - 1})">
                Previous
            </button>
            <span class="page-info">Page ${this.currentPage}</span>
            <button ${this.orders.length < this.itemsPerPage ? 'disabled' : ''} onclick="window.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;
    }

    async showOrderDetails(orderId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderOrderModal(data.data);
            } else {
                throw new Error(data.error || 'Failed to load order details');
            }
            
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showNotification('Failed to load order details. Please try again.', 'error');
        }
    }

    renderOrderModal(order) {
        const modal = document.getElementById('order-detail-modal');
        const content = document.getElementById('order-detail-content');
        
        
        // Handle different data structures from API
        const amountPaid = order.amount_paid || order.amount || 0;
        const totalAmount = order.total_amount || order.amount || 0;
        const isDeposit = order.payment_mode === 'deposit';
        const remainingAmount = totalAmount - amountPaid;
        
        content.innerHTML = `
            <div class="order-detail-section">
                <h4>Order Information</h4>
                <div class="order-detail-grid">
                    <div class="order-detail-item">
                        <span class="order-detail-label">Order ID</span>
                        <span class="order-detail-value">${order.id}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Status</span>
                        <span class="order-detail-value">
                            <span class="status-badge status-${order.status}">${this.getStatusLabel(order.status)}</span>
                        </span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Payment Mode</span>
                        <span class="order-detail-value">${isDeposit ? '70% Deposit' : 'Full Payment'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Order Date</span>
                        <span class="order-detail-value">${this.formatDate(order.created_at)}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Customer Information</h4>
                <div class="order-detail-grid">
                    <div class="order-detail-item">
                        <span class="order-detail-label">Name</span>
                        <span class="order-detail-value">${order.customer_name || 'N/A'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Email</span>
                        <span class="order-detail-value">${order.customer_email || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Pack Information</h4>
                <div class="order-detail-grid">
                    <div class="order-detail-item">
                        <span class="order-detail-label">Pack Name</span>
                        <span class="order-detail-value">${order.pack_name || 'N/A'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Pack ID</span>
                        <span class="order-detail-value">${order.pack_id}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Payment Information</h4>
                <div class="order-detail-grid">
                    <div class="order-detail-item">
                        <span class="order-detail-label">Total Amount</span>
                        <span class="order-detail-value">$${totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Amount Paid</span>
                        <span class="order-detail-value">$${amountPaid.toFixed(2)}</span>
                    </div>
                    ${isDeposit ? `
                        <div class="order-detail-item">
                            <span class="order-detail-label">Remaining Balance</span>
                            <span class="order-detail-value">$${remainingAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="order-detail-item">
                        <span class="order-detail-label">Payment ID</span>
                        <span class="order-detail-value">${order.stripe_checkout_session_id || order.payment_intent_id || 'N/A'}</span>
                    </div>
                    ${order.payment_status ? `
                        <div class="order-detail-item">
                            <span class="order-detail-label">Payment Status</span>
                            <span class="order-detail-value">${order.payment_status}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Actions</h4>
                <div class="action-buttons">
                    ${this.getStatusActionButtons(order)}
                    <button class="btn btn-secondary" onclick="window.closeOrderModal()">Close</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Force modal to be visible with a slight delay to ensure DOM updates
        setTimeout(() => {
            if (window.getComputedStyle(modal).display === 'none') {
                modal.style.display = 'flex !important';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
            }
        }, 100);
    }

    closeOrderModal() {
        const modal = document.getElementById('order-detail-modal');
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    async updateOrderStatus(orderId, newStatus) {
        if (!confirm(`Are you sure you want to update this order status to "${newStatus}"?`)) {
            return;
        }

        // Find the button that was clicked and update its state
        const clickedButton = event.target;
        const originalText = clickedButton.textContent;
        const originalDisabled = clickedButton.disabled;
        
        try {
            // Update button state
            clickedButton.disabled = true;
            clickedButton.textContent = 'Updating...';
            
            const response = await fetch(`${window.API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: `Status updated by admin to ${newStatus}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update local data
            const orderIndex = this.orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex].status = newStatus;
                this.orders[orderIndex].updated_at = new Date().toISOString();
                
                // Re-render the orders table with updated data
                this.renderOrders();
                this.updateStats();
                
                // Update order detail modal if it's open for this order
                const modal = document.getElementById('order-detail-modal');
                if (modal && modal.style.display === 'flex') {
                    const orderDetailContent = document.getElementById('order-detail-content');
                    if (orderDetailContent && orderDetailContent.innerHTML.includes(orderId)) {
                        // Re-render the modal with updated order data
                        this.renderOrderModal(this.orders[orderIndex]);
                    }
                }
            }
            
            // Show success notification
            this.showNotification(`Order status updated to ${newStatus} successfully!`, 'success');
            
            // Close modal
            this.closeOrderModal();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification(`Failed to update order status: ${error.message}`, 'error');
        } finally {
            // Restore button state
            clickedButton.disabled = originalDisabled;
            clickedButton.textContent = originalText;
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadOrders();
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
                    this.showOrders();
                    await this.loadOrders();
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
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 300001;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Global functions for onclick handlers
window.showOrderDetails = function(orderId) {
    // This will be bound to the AdminOrderManager instance
    if (window.adminOrderManager) {
        window.adminOrderManager.showOrderDetails(orderId);
    }
};

window.updateOrderStatus = function(orderId, status) {
    if (window.adminOrderManager) {
        window.adminOrderManager.updateOrderStatus(orderId, status);
    }
};

window.closeOrderModal = function() {
    if (window.adminOrderManager) {
        window.adminOrderManager.closeOrderModal();
    }
};
window.goToPage = function(page) {
    if (window.adminOrderManager) {
        window.adminOrderManager.goToPage(page);
    }
};

// Export class globally
window.AdminOrderManager = AdminOrderManager;

