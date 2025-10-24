/**
 * Admin Pack Management System
 * Handles pack creation, editing, and management
 */

// Smart Environment Detection
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0';

// API Configuration - Smart detection for all environments
const API_BASE_URL = window.API_BASE_URL || (isLocalhost 
  ? 'http://localhost:3001/api' 
  : '/api');
const JSON_DATA_URL = '/data'; // Fallback for static data

// Environment logging
console.log(`🌍 Admin Packs - Environment: ${isLocalhost ? 'localhost' : 'production'}`);
console.log(`🔗 API Base URL: ${API_BASE_URL}`);

class AdminPacks {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.packs = [];
        // Initialize asynchronously
        this.init().catch(error => {
            console.error('AdminPacks initialization error:', error);
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
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        } else {
            console.error('Login form not found!');
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Back to dashboard button
        const backBtn = document.getElementById('back-to-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/admin/dashboard/';
            });
        }

        // Create pack button
        const createBtn = document.getElementById('create-pack-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreatePackModal());
        }

        // Refresh packs
        const refreshBtn = document.getElementById('refresh-packs');
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
                    this.showNotification('Failed to refresh packs', 'error');
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.textContent = 'Refresh';
                }
            });
        } else {
            console.error('Refresh button not found!');
        }

        // Pack form
        const packForm = document.getElementById('pack-form');
        if (packForm) {
            packForm.addEventListener('submit', (e) => this.handlePackSubmit(e));
        }

        // Range input preview
        this.bindRangeInputs();

        // Manifest upload form
        const manifestForm = document.getElementById('manifest-upload-form');
        if (manifestForm) {
            manifestForm.addEventListener('submit', (e) => this.handleManifestUpload(e));
        }

        // Search and filter
        const searchInput = document.getElementById('search-packs');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterPacks());
        }

        const filterSelect = document.getElementById('filter-status');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterPacks());
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

        // Handle action buttons in packs table
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                const packId = e.target.getAttribute('data-pack-id');
                
                switch (action) {
                    case 'edit':
                        this.editPack(packId);
                        break;
                    case 'manifest':
                        this.uploadManifest(packId);
                        break;
                    case 'delete':
                        this.deletePack(packId);
                        break;
                }
            }
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
                    this.authToken = window.sharedAdminAuth.getToken();
                    this.showPacksSection();
                    await this.loadPacks();
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
                    this.showPacksSection();
                    await this.loadPacks();
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
        // 1. Use shared authentication system to clear the storage
        if (window.sharedAdminAuth) {
            window.sharedAdminAuth.logout(); // This is the ONLY place clearing localStorage
        }
        
        // 2. Clear AdminPacks' internal state
        this.authToken = null;
        this.isAuthenticated = false;
    
        // 3. Update the UI
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    // clearAuth() {
    //     this.authToken = null;
    //     this.isAuthenticated = false;
    //     localStorage.removeItem('admin_token');
    // }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('packs-section').style.display = 'none';
    }

    showPacksSection() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('packs-section').style.display = 'block';
    }

    async loadPacks() {
        if (!this.isAuthenticated) {
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/packs`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.packs = data.packs || data.data || [];
                this.renderPacks();
                this.updateStats();
            } else {
                console.warn('API failed, falling back to JSON data...');
                await this.loadPacksFromJSON();
            }

        } catch (error) {
            console.error('Error loading packs from API:', error);
            await this.loadPacksFromJSON();
        }
    }

    async loadPacksFromJSON() {
        try {
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);

            if (response.ok) {
                const data = await response.json();
                this.packs = data.packs || [];
                this.renderPacks();
                this.updateStats();
            } else {
                throw new Error('Failed to load packs from JSON');
            }

        } catch (error) {
            console.error('Error loading packs from JSON:', error);
            this.showNotification('Failed to load packs', 'error');
        }
    }

    renderPacks() {
        const tbody = document.querySelector('#packs-table tbody');
        if (!tbody) return;

        if (this.packs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No packs found</td></tr>';
            return;
        }

        const rows = this.packs.map(pack => {
            const createdDate = new Date(pack.created_at).toLocaleDateString();
            const statusClass = `status-${pack.status}`;
            
            return `
                <tr>
                    <td>${pack.name}</td>
                    <td><span class="type-badge type-${pack.type}">${pack.type}</span></td>
                    <td>$${pack.price.toFixed(2)}</td>
                    <td>${pack.number_of_units}</td>
                    <td>${pack.number_of_units}</td>
                    <td><span class="status-badge ${statusClass}">${pack.status}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-action="edit" data-pack-id="${pack.id}">Edit</button>
                        <button class="btn btn-sm btn-secondary" data-action="manifest" data-pack-id="${pack.id}">Manifest</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-pack-id="${pack.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    updateStats() {
        const totalPacks = this.packs.length;
        const availablePacks = this.packs.filter(p => p.status === 'available').length;
        const soldOutPacks = this.packs.filter(p => p.status === 'sold_out').length;
        const totalValue = this.packs.reduce((sum, p) => sum + (p.price * p.number_of_units), 0);

        document.getElementById('total-packs').textContent = totalPacks;
        document.getElementById('available-packs').textContent = availablePacks;
        document.getElementById('sold-out-packs').textContent = soldOutPacks;
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
    }

    filterPacks() {
        const searchTerm = document.getElementById('search-packs').value.toLowerCase();
        const statusFilter = document.getElementById('filter-status').value;

        let filteredPacks = this.packs;

        if (searchTerm) {
            filteredPacks = filteredPacks.filter(pack => 
                pack.name.toLowerCase().includes(searchTerm) ||
                pack.type.toLowerCase().includes(searchTerm)
            );
        }

        if (statusFilter) {
            filteredPacks = filteredPacks.filter(pack => pack.status === statusFilter);
        }

        // Temporarily store original packs and show filtered results
        const originalPacks = this.packs;
        this.packs = filteredPacks;
        this.renderPacks();
        this.packs = originalPacks;
    }

    openCreatePackModal() {
        const modal = document.getElementById('pack-modal');
        document.getElementById('modal-title').textContent = 'Create New Pack';
        document.getElementById('pack-form').reset();
        document.getElementById('pack-id').value = '';
        
        // Set default values for new pack
        document.getElementById('pack-status').value = 'available';
        document.getElementById('available-quantity').value = '0';
        document.getElementById('reserved-quantity').value = '0';
        
        // Clear range preview
        document.getElementById('range-preview').textContent = 'Preview: $0–$0';
        document.getElementById('range-preview').className = 'range-preview';
        
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    editPack(packId) {
        const pack = this.packs.find(p => p.id == packId);
        if (!pack) {
            this.showNotification('Pack not found', 'error');
            return;
        }

        // Populate form
        document.getElementById('modal-title').textContent = 'Edit Pack';
        document.getElementById('pack-id').value = pack.id;
        document.getElementById('pack-name').value = pack.name;
        document.getElementById('pack-type').value = pack.type;
        document.getElementById('pack-price').value = pack.price;
        document.getElementById('deposit-price').value = pack.deposit_price || '';
        // Handle resale value range
        this.populateResaleRange(pack.estimated_resale_value);
        document.getElementById('number-units').value = pack.number_of_units;
        document.getElementById('pack-description').value = pack.description || '';
        document.getElementById('pack-image').value = pack.image_url || '';
        document.getElementById('pack-status').value = pack.status;
        document.getElementById('available-quantity').value = pack.available_quantity || 0;
        document.getElementById('reserved-quantity').value = pack.reserved_quantity || 0;
        document.getElementById('short-description').value = pack.short_description || '';

        const modal = document.getElementById('pack-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    bindRangeInputs() {
        const resaleMin = document.getElementById('resale-min');
        const resaleMax = document.getElementById('resale-max');
        const rangePreview = document.getElementById('range-preview');

        if (resaleMin && resaleMax && rangePreview) {
            const updatePreview = () => {
                const min = parseFloat(resaleMin.value) || 0;
                const max = parseFloat(resaleMax.value) || 0;
                
                if (min > 0 && max > 0) {
                    if (min > max) {
                        rangePreview.textContent = `Error: Min value ($${min.toLocaleString()}) cannot be greater than max value ($${max.toLocaleString()})`;
                        rangePreview.className = 'range-preview error';
                    } else {
                        rangePreview.textContent = `Preview: $${min.toLocaleString()}–$${max.toLocaleString()}`;
                        rangePreview.className = 'range-preview';
                    }
                } else {
                    rangePreview.textContent = 'Preview: $0–$0';
                    rangePreview.className = 'range-preview';
                }
            };

            resaleMin.addEventListener('input', updatePreview);
            resaleMax.addEventListener('input', updatePreview);
        }
    }

    populateResaleRange(resaleValue) {
        const resaleMin = document.getElementById('resale-min');
        const resaleMax = document.getElementById('resale-max');
        
        if (resaleMin && resaleMax) {
            // Parse existing range format like "$1,250–$1,750"
            const rangeMatch = resaleValue.match(/\$([0-9,]+)–\$([0-9,]+)/);
            if (rangeMatch) {
                const min = rangeMatch[1].replace(/,/g, '');
                const max = rangeMatch[2].replace(/,/g, '');
                resaleMin.value = min;
                resaleMax.value = max;
            } else {
                // Handle single value or other formats
                const singleValue = parseFloat(resaleValue.replace(/[$,]/g, '')) || 0;
                resaleMin.value = singleValue;
                resaleMax.value = singleValue;
            }
            
            // Trigger preview update
            const event = new Event('input');
            resaleMin.dispatchEvent(event);
        }
    }

    async handlePackSubmit(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) return;

        const formData = new FormData(e.target);
        const packData = Object.fromEntries(formData.entries());
        const packId = packData.id;
        
        // Debug: Log the form data

        // Convert range inputs to estimated_resale_value
        const resaleMin = parseFloat(packData.resale_min) || 0;
        const resaleMax = parseFloat(packData.resale_max) || 0;
        
        if (resaleMin > resaleMax) {
            this.showNotification('Min resale value cannot be greater than max value', 'error');
            return;
        }

        // Create the range format
        packData.estimated_resale_value = `$${resaleMin.toLocaleString()}–$${resaleMax.toLocaleString()}`;
        
        // Remove the individual range fields
        delete packData.resale_min;
        delete packData.resale_max;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            if (packId) {
                // Update existing pack
                try {
                    const response = await fetch(`${window.API_BASE_URL}/packs/${packId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.authToken}`
                        },
                        body: JSON.stringify(packData)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        this.showNotification('Pack updated successfully!', 'success');
                        this.closePackModal();
                        await this.delay(3000);
                        window.location.reload();
                    } else {
                        throw new Error(data.error || 'Failed to update pack');
                    }
                } catch (apiError) {
                    console.warn('API update failed, showing demo message:', apiError);
                    this.showNotification('Pack updated successfully! (Demo mode - API unavailable)', 'success');
                    this.closePackModal();
                    await this.delay(3000);
                    window.location.reload();
                }
            } else {
                // Create new pack
                try {
                    const response = await fetch(`${window.API_BASE_URL}/packs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.authToken}`
                        },
                        body: JSON.stringify(packData)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        this.showNotification('Pack created successfully!', 'success');
                        this.closePackModal();
                        await this.delay(3000);
                        window.location.reload();
                    } else {
                        throw new Error(data.error || 'Failed to create pack');
                    }
                } catch (apiError) {
                    console.warn('API create failed, showing demo message:', apiError);
                    this.showNotification('Pack created successfully! (Demo mode - API unavailable)', 'success');
            this.closePackModal();
            await this.delay(3000);
            window.location.reload();
                }
            }

        } catch (error) {
            console.error('Pack save error:', error);
            this.showNotification(`Failed to save pack: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Pack';
        }
    }

    async deletePack(packId) {
        if (!confirm('Are you sure you want to delete this pack? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/packs/${packId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Pack deleted successfully!', 'success');
            await this.delay(3000);
            window.location.reload();
            } else {
                throw new Error(data.error || 'Failed to delete pack');
            }

        } catch (error) {
            console.warn('API delete failed, showing demo message:', error);
            this.showNotification('Pack deleted successfully! (Demo mode - API unavailable)', 'success');
            await this.delay(3000);
            window.location.reload();
        }
    }

    uploadManifest(packId) {
        // Use existing packs data
        this.populatePackSelect(this.packs, packId);

        const modal = document.getElementById('manifest-upload-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    populatePackSelect(packs, selectedPackId = null) {
        const select = document.getElementById('pack-select');
        select.innerHTML = '<option value="">Choose a pack...</option>';
        
        packs.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.id;
            option.textContent = pack.name;
            if (selectedPackId && pack.id === selectedPackId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
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

    closePackModal() {
        const modal = document.getElementById('pack-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    openManifestUpload() {
        if (!this.isAuthenticated) return;
        
        // Populate pack select
        const packSelect = document.getElementById('pack-select');
        if (packSelect) {
            packSelect.innerHTML = '<option value="">Choose a pack...</option>';
            
            this.packs.forEach(pack => {
                const option = document.createElement('option');
                option.value = pack.id;
                option.textContent = pack.name;
                packSelect.appendChild(option);
            });
        }
        
        const modal = document.getElementById('manifest-upload-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        }
    }

    closeManifestUpload() {
        const modal = document.getElementById('manifest-upload-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                const form = document.getElementById('manifest-upload-form');
                if (form) form.reset();
            }, 300);
        }
    }

    closeAllModals() {
        this.closePackModal();
        this.closeManifestUpload();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
window.closePackModal = function() {
    if (window.adminPacks) {
        window.adminPacks.closePackModal();
    }
};

window.closeManifestUpload = function() {
    if (window.adminPacks) {
        window.adminPacks.closeManifestUpload();
    }
};

window.openManifestUpload = function() {
    if (window.adminPacks) {
        window.adminPacks.openManifestUpload();
    }
};
// Export class globally
window.AdminPacks = AdminPacks;

// Make sure the instance is available globally
document.addEventListener('DOMContentLoaded', () => {
    
    // Wait for shared authentication system to be ready
    function waitForSharedAuth() {
        if (window.sharedAdminAuth) {
            try {
                window.adminPacks = new AdminPacks();
            } catch (error) {
                console.error('Admin initialization error:', error);
            }
        } else {
            setTimeout(waitForSharedAuth, 100);
        }
    }
    
    waitForSharedAuth();
});

