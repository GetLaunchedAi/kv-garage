/**
 * Admin Pack Management System
 * Handles pack creation, editing, and management
 */

// Using JSON data instead of API
const JSON_DATA_URL = '/data';

class AdminPacks {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.packs = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    bindEvents() {
        console.log('Binding events...');
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        console.log('Login form element:', loginForm);
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('Login form event listener added');
        } else {
            console.error('Login form not found!');
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Create pack button
        const createBtn = document.getElementById('create-pack-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreatePackModal());
        }

        // Refresh packs
        const refreshBtn = document.getElementById('refresh-packs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPacks());
        }

        // Pack form
        const packForm = document.getElementById('pack-form');
        if (packForm) {
            packForm.addEventListener('submit', (e) => this.handlePackSubmit(e));
        }

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
        // Use shared authentication system
        if (window.sharedAdminAuth && window.sharedAdminAuth.isLoggedIn()) {
            this.isAuthenticated = true;
            this.authToken = window.sharedAdminAuth.getToken();
            this.showPacksSection();
            await this.loadPacks();
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
            // Use shared authentication system
            if (window.sharedAdminAuth) {
                const result = window.sharedAdminAuth.login(email, password);
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
        // Use shared authentication system
        if (window.sharedAdminAuth) {
            window.sharedAdminAuth.logout();
        }
        this.clearAuth();
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
        document.getElementById('packs-section').style.display = 'none';
    }

    showPacksSection() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('packs-section').style.display = 'block';
    }

    async loadPacks() {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch(`${JSON_DATA_URL}/packs.json`);

            if (response.ok) {
                const data = await response.json();
                this.packs = data.packs || [];
                this.renderPacks();
                this.updateStats();
            } else {
                throw new Error('Failed to load packs');
            }

        } catch (error) {
            console.error('Error loading packs:', error);
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
        document.getElementById('estimated-resale').value = pack.estimated_resale_value;
        document.getElementById('number-units').value = pack.number_of_units;
        document.getElementById('pack-description').value = pack.description || '';
        document.getElementById('pack-image').value = pack.image_url || '';
        document.getElementById('pack-status').value = pack.status;

        const modal = document.getElementById('pack-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    async handlePackSubmit(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) return;

        const formData = new FormData(e.target);
        const packData = Object.fromEntries(formData.entries());
        const packId = packData.id;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            // Demo mode - just show success message
            // In a real app, you'd save to a database
            this.showNotification(packId ? 'Pack updated successfully! (Demo mode)' : 'Pack created successfully! (Demo mode)', 'success');
            this.closePackModal();
            this.loadPacks();

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
            // Demo mode - just show success message
            // In a real app, you'd delete from a database
            this.showNotification('Pack deleted successfully! (Demo mode)', 'success');
            this.loadPacks();

        } catch (error) {
            console.error('Delete pack error:', error);
            this.showNotification('Failed to delete pack', 'error');
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

// Make sure the instance is available globally
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin script loading...');
    try {
        window.adminPacks = new AdminPacks();
        console.log('Admin initialized successfully');
    } catch (error) {
        console.error('Admin initialization error:', error);
    }
});
