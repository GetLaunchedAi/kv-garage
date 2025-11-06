/**
 * Admin Product Management System
 * Handles product creation, editing, and management
 */

// Using JSON data instead of API
const JSON_DATA_URL = '/data';
// Detect if we're in development (localhost) and use PHP server, otherwise use relative path
const PRODUCTS_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api/save-products.php'
    : '/api/save-products.php';

class AdminProducts {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.products = [];
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
        } else {
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Create product button
        const createBtn = document.getElementById('create-product-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateProductModal());
        }

        // Refresh products
        const refreshBtn = document.getElementById('refresh-products');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadProducts());
        }

        // Search and filter
        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterProducts());
        }

        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => this.filterProducts());
        }

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => this.filterProducts());
        }

        // Multiple images preview
        const imagesInput = document.getElementById('product-images');
        if (imagesInput) {
            imagesInput.addEventListener('change', (e) => this.handleImagesPreview(e));
        }

        // Auto-generate slug from title
        const titleInput = document.getElementById('product-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => this.generateSlugFromTitle(e));
        }

        // Close modals on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeProductModal();
            }
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
            }
        });

        // Handle action buttons in products table
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                const productId = e.target.getAttribute('data-product-id');
                
                switch (action) {
                    case 'edit':
                        this.editProduct(productId);
                        break;
                    case 'delete':
                        this.deleteProduct(productId);
                        break;
                }
            }
        });

        // Handle product form submission
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
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
                    this.showProductsSection();
                    await this.loadProducts();
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
                    this.showProductsSection();
                    await this.loadProducts();
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
        // 1. Use shared authentication system to clear the storage
        if (window.sharedAdminAuth) {
            window.sharedAdminAuth.logout();
        }
        
        // 2. Clear AdminProducts' internal state
        this.authToken = null;
        this.isAuthenticated = false;
    
        // 3. Update the UI
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('products-section').style.display = 'none';
    }

    showProductsSection() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('products-section').style.display = 'block';
    }

    async loadProducts() {
        if (!this.isAuthenticated) return;

        try {
            // Try loading from /data/products.json first, fallback to /products.json
            let response = await fetch(`${JSON_DATA_URL}/products.json`);
            if (!response.ok) {
                response = await fetch('/products.json');
            }

            if (response.ok) {
                const data = await response.json();
                this.products = Array.isArray(data) ? data : (data.products || []);
                this.renderProducts();
                this.updateStats();
                this.populateCategoryFilter();
            } else {
                throw new Error('Failed to load products');
            }

        } catch (error) {
            this.showNotification('Failed to load products', 'error');
        }
    }

    renderProducts() {
        const tbody = document.querySelector('#products-table tbody');
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No products found</td></tr>';
            return;
        }

        const rows = this.products.map(product => {
            const createdDate = product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A';
            const statusClass = `status-${(product.status || '').toLowerCase().replace(/\s+/g, '-')}`;
            const imageUrl = product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
            const inStock = product.inStock !== false && (product.price > 0);
            const stockBadge = inStock ? '<span class="stock-badge in-stock">In Stock</span>' : '<span class="stock-badge out-of-stock">Out of Stock</span>';
            
            return `
                <tr>
                    <td><img src="${imageUrl}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${this.escapeHtml(product.title)}</td>
                    <td><span class="category-badge">${this.escapeHtml(product.category)}</span></td>
                    <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${this.escapeHtml(product.status || 'N/A')}</span></td>
                    <td>${this.escapeHtml(product.sku || product.slug || 'N/A')}</td>
                    <td>${stockBadge}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-action="edit" data-product-id="${product.id}">Edit</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-product-id="${product.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    updateStats() {
        const totalProducts = this.products.length;
        const inStockProducts = this.products.filter(p => p.inStock !== false && (p.price > 0)).length;
        const outOfStockProducts = this.products.filter(p => p.inStock === false || (p.price === 0)).length;
        const totalValue = this.products.reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

        const totalEl = document.getElementById('total-products');
        const inStockEl = document.getElementById('in-stock-products');
        const outOfStockEl = document.getElementById('out-of-stock-products');
        const totalValueEl = document.getElementById('total-value');

        if (totalEl) totalEl.textContent = totalProducts;
        if (inStockEl) inStockEl.textContent = inStockProducts;
        if (outOfStockEl) outOfStockEl.textContent = outOfStockProducts;
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
    }

    populateCategoryFilter() {
        const filterCategory = document.getElementById('filter-category');
        if (!filterCategory) return;

        const categories = [...new Set(this.products.map(p => p.category).filter(Boolean))].sort();
        const currentValue = filterCategory.value;

        filterCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategory.appendChild(option);
        });

        if (currentValue) {
            filterCategory.value = currentValue;
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-products')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('filter-category')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        let filteredProducts = this.products;

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.title?.toLowerCase().includes(searchTerm) ||
                product.category?.toLowerCase().includes(searchTerm) ||
                product.sku?.toLowerCase().includes(searchTerm) ||
                product.slug?.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }

        if (statusFilter) {
            filteredProducts = filteredProducts.filter(product => {
                if (statusFilter === 'in_stock') {
                    return product.inStock !== false && (product.price > 0);
                } else if (statusFilter === 'out_of_stock') {
                    return product.inStock === false || (product.price === 0);
                }
                return product.status === statusFilter;
            });
        }

        // Temporarily store original products and show filtered results
        const originalProducts = this.products;
        this.products = filteredProducts;
        this.renderProducts();
        this.products = originalProducts;
    }

    openCreateProductModal() {
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-title').textContent = 'Create New Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        this.clearImagePreviews();
        
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) {
            this.showNotification('Product not found', 'error');
            return;
        }

        // Populate form
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-title').value = product.title || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price || 0;
        document.getElementById('product-currency').value = product.currency || 'USD';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-sku').value = product.sku || product.slug || '';
        document.getElementById('product-status').value = product.status || 'New Arrival';
        document.getElementById('product-quantity').value = product.quantity || '';
        // Set checkbox based on actual inStock value (explicitly check for false)
        const inStockCheckbox = document.getElementById('product-in-stock');
        if (inStockCheckbox) {
            // Explicitly check if inStock is false, otherwise default to true
            inStockCheckbox.checked = product.inStock !== false;
        }

        // Show existing images if any
        this.clearImagePreviews();
        const images = product.images || (product.image ? [product.image] : []);
        if (images.length > 0) {
            this.displayExistingImages(images);
        }

        const modal = document.getElementById('product-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            // Remove from local array (for now, actual deletion would require API endpoint)
            this.products = this.products.filter(p => p.id != productId);
            this.renderProducts();
            this.updateStats();
            this.showNotification('Product deleted successfully!', 'success');
            // TODO: Implement actual API deletion endpoint if needed
        } catch (error) {
            this.showNotification('Failed to delete product', 'error');
        }
    }

    async handleProductSubmit(e) {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Log to verify what's being sent
        for (let [key, value] of formData.entries()) {
        }

        try {
            const response = await fetch(PRODUCTS_API_URL, {
                method: 'POST',
                body: formData,
            });

            // Always read as text first (helps debug)
            const text = await response.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch (err) {
                alert("❌ Invalid server response (check console).");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to save product');
            }

            this.showNotification(`✅ Product ${result.message?.includes('updated') ? 'updated' : 'created'} successfully!`, 'success');

            // Refresh products list and close modal
            this.closeProductModal();
            await this.loadProducts();
        } catch (err) {
            this.showNotification(`❌ Failed to save product: ${err.message}`, 'error');
        }
    }

    handleImagesPreview(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const container = document.getElementById('images-preview-container');
        if (!container) return;

        files.forEach((file, index) => {
            // Validate file size (8MB max)
            if (file.size > 8 * 1024 * 1024) {
                this.showNotification(`File "${file.name}" is too large (max 8MB)`, 'error');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showNotification(`File "${file.name}" is not an image`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const previewId = `preview-${Date.now()}-${index}`;
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.dataset.fileIndex = index;
                previewItem.innerHTML = `
                    <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb; background: #f8fafc;">
                        <img src="${event.target.result}" alt="Preview ${index + 1}" 
                             style="width: 100%; height: 120px; object-fit: cover; display: block;">
                        <button type="button" class="remove-image-btn" data-preview-id="${previewId}" 
                                style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center;" 
                                title="Remove image">×</button>
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 4px; font-size: 10px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
                    </div>
                `;
                previewItem.id = previewId;
                container.appendChild(previewItem);

                // Add remove button handler
                const removeBtn = previewItem.querySelector('.remove-image-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => this.removeImagePreview(previewId, index));
                }
            };
            reader.readAsDataURL(file);
        });
    }

    displayExistingImages(imageUrls) {
        const container = document.getElementById('existing-images-container');
        if (!container) return;

        container.innerHTML = '';
        imageUrls.forEach((url, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'existing-image-item';
            previewItem.dataset.imageUrl = url;
            previewItem.innerHTML = `
                <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #10b981; background: #f8fafc;">
                    <img src="${url}" alt="Existing image ${index + 1}" 
                         style="width: 100%; height: 120px; object-fit: cover; display: block;">
                    <button type="button" class="remove-existing-image-btn" data-image-url="${url}" 
                            style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center;" 
                            title="Remove image">×</button>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(16, 185, 129, 0.8); color: white; padding: 4px; font-size: 10px; text-align: center;">Existing</div>
                </div>
            `;
            container.appendChild(previewItem);

            // Add remove button handler
            const removeBtn = previewItem.querySelector('.remove-existing-image-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.removeExistingImage(url));
            }
        });
    }

    removeImagePreview(previewId, fileIndex) {
        const previewItem = document.getElementById(previewId);
        if (previewItem) {
            previewItem.remove();
        }

        // Remove file from input
        const input = document.getElementById('product-images');
        if (input && input.files) {
            const dt = new DataTransfer();
            Array.from(input.files).forEach((file, index) => {
                if (index !== fileIndex) {
                    dt.items.add(file);
                }
            });
            input.files = dt.files;
        }
    }

    removeExistingImage(imageUrl) {
        const container = document.getElementById('existing-images-container');
        if (!container) return;

        const item = container.querySelector(`[data-image-url="${imageUrl}"]`);
        if (item) {
            item.remove();
        }

        // Store removed images in a hidden field for backend processing
        let removedImages = JSON.parse(document.getElementById('removed-images')?.value || '[]');
        if (!removedImages.includes(imageUrl)) {
            removedImages.push(imageUrl);
        }
        
        let hiddenInput = document.getElementById('removed-images');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'removed-images';
            hiddenInput.name = 'removed_images';
            document.getElementById('product-form').appendChild(hiddenInput);
        }
        hiddenInput.value = JSON.stringify(removedImages);
    }

    clearImagePreviews() {
        const previewContainer = document.getElementById('images-preview-container');
        const existingContainer = document.getElementById('existing-images-container');
        if (previewContainer) previewContainer.innerHTML = '';
        if (existingContainer) existingContainer.innerHTML = '';
        
        // Clear removed images
        const removedInput = document.getElementById('removed-images');
        if (removedInput) removedInput.remove();
        
        // Clear file input
        const imagesInput = document.getElementById('product-images');
        if (imagesInput) imagesInput.value = '';
    }

    generateSlugFromTitle(e) {
        const title = e.target.value;
        const slugInput = document.getElementById('product-sku');
        if (slugInput && !slugInput.value) {
            // Auto-generate slug from title
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            slugInput.value = slug;
        }
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                const form = document.getElementById('product-form');
                if (form) {
                    form.reset();
                    document.getElementById('product-id').value = '';
                    this.clearImagePreviews();
                }
            }, 300);
        }
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for onclick handlers
window.closeProductModal = function() {
    if (window.adminProducts) {
        window.adminProducts.closeProductModal();
    }
};

// Make sure the instance is available globally
document.addEventListener('DOMContentLoaded', () => {
    
    // Wait for shared authentication system to be ready
    function waitForSharedAuth() {
        if (window.sharedAdminAuth) {
            try {
                window.adminProducts = new AdminProducts();
            } catch (error) {
            }
        } else {
            setTimeout(waitForSharedAuth, 100);
        }
    }
    
    waitForSharedAuth();
});
