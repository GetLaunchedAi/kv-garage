/**
 * Admin Order Management System
 * Handles order viewing, status updates, and management
 */

// Using JSON data instead of API
const JSON_DATA_URL = '/data';

class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.statusFilter = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    checkAuthentication() {
        // Use shared authentication system
        if (window.sharedAdminAuth && window.sharedAdminAuth.isLoggedIn()) {
            this.isAuthenticated = true;
            this.showOrders();
            this.loadOrders();
        } else {
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
        document.getElementById('refresh-orders')?.addEventListener('click', () => {
            this.loadOrders();
        });

        // Status filter
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.currentPage = 1;
            this.loadOrders();
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
                limit: this.itemsPerPage,
                offset: (this.currentPage - 1) * this.itemsPerPage
            });
            
            if (this.statusFilter) {
                params.append('status', this.statusFilter);
            }

            const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const { data: orders } = await response.json();
            this.orders = orders;
            
            this.renderOrders();
            this.updateStats();
            this.renderPagination();
            
        } catch (error) {
            console.error('Error loading orders:', error);
            if (error.message.includes('401') || error.message.includes('403')) {
                this.showError('Authentication failed. Please log in again.');
                // Clear token and show login
                localStorage.removeItem('admin_token');
                this.showLogin();
            } else {
                this.showError('Failed to load orders. Please try again.');
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
        const paymentMode = order.payment_mode === 'full' ? 'Full Payment' : '50% Deposit';
        
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
                    <span class="payment-mode">${paymentMode}</span>
                </td>
                <td>
                    <div class="amount-info">
                        <div class="amount-paid">$${order.amount_paid.toFixed(2)}</div>
                        ${order.payment_mode === 'deposit' ? 
                            `<div class="remaining-amount">Remaining: $${(order.total_amount - order.amount_paid).toFixed(2)}</div>` : 
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
                        <button class="btn btn-sm btn-primary" onclick="this.showOrderDetails('${order.id}')">
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
                    <button class="btn btn-sm btn-success" onclick="this.updateOrderStatus('${order.id}', 'reserved')">
                        Mark Reserved
                    </button>
                `);
                break;
            case 'reserved':
                buttons.push(`
                    <button class="btn btn-sm btn-success" onclick="this.updateOrderStatus('${order.id}', 'completed')">
                        Mark Completed
                    </button>
                `);
                break;
            case 'completed':
                buttons.push(`
                    <button class="btn btn-sm btn-warning" onclick="this.updateOrderStatus('${order.id}', 'shipped')">
                        Mark Shipped
                    </button>
                `);
                break;
        }
        
        if (order.status !== 'cancelled' && order.status !== 'shipped') {
            buttons.push(`
                <button class="btn btn-sm btn-danger" onclick="this.updateOrderStatus('${order.id}', 'cancelled')">
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
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.amount_paid, 0);

        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('completed-orders').textContent = completedOrders;
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    }

    renderPagination() {
        // Simple pagination - in a real app, you'd get total count from the API
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="this.goToPage(${this.currentPage - 1})">
                Previous
            </button>
            <span class="page-info">Page ${this.currentPage}</span>
            <button ${this.orders.length < this.itemsPerPage ? 'disabled' : ''} onclick="this.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;
    }

    async showOrderDetails(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const { data: order } = await response.json();
            this.renderOrderModal(order);
            
        } catch (error) {
            console.error('Error loading order details:', error);
            alert('Failed to load order details. Please try again.');
        }
    }

    renderOrderModal(order) {
        const modal = document.getElementById('order-detail-modal');
        const content = document.getElementById('order-detail-content');
        
        const isDeposit = order.payment_mode === 'deposit';
        const remainingAmount = order.total_amount - order.amount_paid;
        
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
                        <span class="order-detail-value">${isDeposit ? '50% Deposit' : 'Full Payment'}</span>
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
                        <span class="order-detail-value">$${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Amount Paid</span>
                        <span class="order-detail-value">$${order.amount_paid.toFixed(2)}</span>
                    </div>
                    ${isDeposit ? `
                        <div class="order-detail-item">
                            <span class="order-detail-label">Remaining Balance</span>
                            <span class="order-detail-value">$${remainingAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="order-detail-item">
                        <span class="order-detail-label">Stripe Session ID</span>
                        <span class="order-detail-value">${order.stripe_checkout_session_id || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Actions</h4>
                <div class="action-buttons">
                    ${this.getStatusActionButtons(order)}
                    <button class="btn btn-secondary" onclick="this.closeOrderModal()">Close</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeOrderModal() {
        const modal = document.getElementById('order-detail-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async updateOrderStatus(orderId, newStatus) {
        if (!confirm(`Are you sure you want to update this order status to "${newStatus}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
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

            // Reload orders to reflect the change
            this.loadOrders();
            this.closeOrderModal();
            
            alert('Order status updated successfully!');
            
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status. Please try again.');
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
            z-index: 10000;
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
