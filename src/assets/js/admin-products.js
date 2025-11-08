/**
 * Simple Admin Product Management
 */

const PRODUCTS_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api/save-products.php'
    : '/api/save-products.php';

class AdminProducts {
    constructor() {
        this.isAuthenticated = false;
        this.products = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    bindEvents() {
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const createBtn = document.getElementById('create-product-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateProductModal());
        }

        const refreshBtn = document.getElementById('refresh-products');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadProducts());
        }

        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterProducts());
        }

        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => this.filterProducts());
        }

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterProducts());
        }

        const imagesInput = document.getElementById('product-images');
        if (imagesInput) {
            imagesInput.addEventListener('change', (e) => this.handleImagesPreview(e));
        }

        const titleInput = document.getElementById('product-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => this.generateSlugFromTitle(e));
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeProductModal();
            }
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                const productId = e.target.getAttribute('data-product-id');
                const productSlug = e.target.getAttribute('data-product-slug');
                if (action === 'edit') {
                    this.editProduct(productId, productSlug);
                } else if (action === 'delete') {
                    this.deleteProduct(productId, productSlug);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
            }
        });

        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        }
    }

    async checkAuthentication() {
        try {
            if (window.sharedAdminAuth) {
                const autoLoginSuccess = window.sharedAdminAuth.shouldAutoLogin();
                if (autoLoginSuccess && window.sharedAdminAuth.isLoggedIn()) {
                    this.isAuthenticated = true;
                    this.showProductsSection();
                    await this.loadProducts();
                    return;
                }
            }
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
            if (window.sharedAdminAuth) {
                const result = window.sharedAdminAuth.login(email, password);
                if (result.success) {
                    this.isAuthenticated = true;
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
        if (window.sharedAdminAuth) {
            window.sharedAdminAuth.logout();
        }
        this.isAuthenticated = false;
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    showLogin() {
        const loginSection = document.getElementById('login-section');
        const productsSection = document.getElementById('products-section');
        if (loginSection) loginSection.style.display = 'block';
        if (productsSection) productsSection.style.display = 'none';
    }

    showProductsSection() {
        const loginSection = document.getElementById('login-section');
        const productsSection = document.getElementById('products-section');
        if (loginSection) loginSection.style.display = 'none';
        if (productsSection) productsSection.style.display = 'block';
    }

    async loadProducts() {
        if (!this.isAuthenticated) return;

        try {
            const url = '/products.json?cb=' + Date.now();
            const response = await fetch(url, { cache: 'no-store' });
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }

            const data = await response.json();
            this.products = Array.isArray(data) ? data : (data.products || []);
            this.renderProducts();
            this.updateStats();
            this.populateCategoryFilter();
        } catch (error) {
            this.showNotification(`Failed to load products: ${error.message}`, 'error');
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
            const stockBadge = inStock 
                ? '<span class="stock-badge in-stock">In Stock</span>' 
                : '<span class="stock-badge out-of-stock">Out of Stock</span>';
            
            return `
                <tr>
                    <td><img src="${imageUrl}" alt="${this.escapeHtml(product.title)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${this.escapeHtml(product.title)}</td>
                    <td><span class="category-badge">${this.escapeHtml(product.category)}</span></td>
                    <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${this.escapeHtml(product.status || 'N/A')}</span></td>
                    <td>${this.escapeHtml(product.sku || product.slug || 'N/A')}</td>
                    <td>${stockBadge}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-action="edit" 
                                data-product-id="${this.escapeHtml(String(product.id ?? ''))}" 
                                data-product-slug="${this.escapeHtml(product.slug || '')}">Edit</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" 
                                data-product-id="${this.escapeHtml(String(product.id ?? ''))}" 
                                data-product-slug="${this.escapeHtml(product.slug || '')}">Delete</button>
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
        const searchTerm = (document.getElementById('search-products')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('filter-category')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        let filtered = this.products;

        if (searchTerm) {
            filtered = filtered.filter(p => 
                (p.title || '').toLowerCase().includes(searchTerm) ||
                (p.category || '').toLowerCase().includes(searchTerm) ||
                (p.sku || '').toLowerCase().includes(searchTerm) ||
                (p.slug || '').toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        if (statusFilter) {
            if (statusFilter === 'in_stock') {
                filtered = filtered.filter(p => p.inStock !== false && (p.price > 0));
            } else if (statusFilter === 'out_of_stock') {
                filtered = filtered.filter(p => p.inStock === false || (p.price === 0));
            } else {
                filtered = filtered.filter(p => p.status === statusFilter);
            }
        }

        const original = this.products;
        this.products = filtered;
        this.renderProducts();
        this.products = original;
    }

    openCreateProductModal() {
        const modal = document.getElementById('product-modal');
        if (!modal) return;

        document.getElementById('modal-title').textContent = 'Create New Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        this.clearImagePreviews();
        
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    editProduct(productId, productSlug) {
        const product = this.products.find(p => {
            const matchesId = productId && p.id !== undefined && p.id !== null && String(p.id) === String(productId);
            const matchesSlug = productSlug && p.slug && p.slug === productSlug;
            return matchesId || matchesSlug;
        });

        if (!product) {
            this.showNotification('Product not found', 'error');
            return;
        }

        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id ?? '';
        document.getElementById('product-title').value = product.title || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price || 0;
        document.getElementById('product-currency').value = product.currency || 'USD';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-sku').value = product.sku || product.slug || '';
        document.getElementById('product-status').value = product.status || 'New Arrival';
        document.getElementById('product-quantity').value = product.quantity || '';

        const inStockCheckbox = document.getElementById('product-in-stock');
        if (inStockCheckbox) {
            inStockCheckbox.checked = product.inStock !== false;
        }

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

    async deleteProduct(productId, productSlug) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            if (productId) formData.append('id', productId);
            if (productSlug) formData.append('slug', productSlug);

            const response = await fetch(PRODUCTS_API_URL, {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('Response text:', text);
                throw new Error('Invalid server response: ' + text.substring(0, 100));
            }

            if (!response.ok || !result.ok) {
                const errorMsg = result.error || 'Delete failed';
                console.error('Delete error:', result);
                throw new Error(errorMsg);
            }

            this.showNotification('Product deleted successfully!', 'success');
            await this.loadProducts();
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification(`Failed to delete: ${error.message}`, 'error');
        }
    }

    async handleProductSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.currentTarget);
            const response = await fetch(PRODUCTS_API_URL, {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('Response text:', text);
                throw new Error('Invalid server response: ' + text.substring(0, 100));
            }

            if (!response.ok || !result.ok) {
                const errorMsg = result.error || 'Save failed';
                console.error('Save error:', result);
                throw new Error(errorMsg);
            }

            this.showNotification(`Product ${result.message?.toLowerCase()} successfully!`, 'success');
            this.closeProductModal();
            await this.loadProducts();
        } catch (error) {
            console.error('Submit error:', error);
            this.showNotification(`Failed to save: ${error.message}`, 'error');
        }
    }

    handleImagesPreview(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const container = document.getElementById('images-preview-container');
        if (!container) return;

        files.forEach((file, index) => {
            if (file.size > 8 * 1024 * 1024) {
                this.showNotification(`File "${file.name}" is too large (max 8MB)`, 'error');
                return;
            }

            if (!file.type.startsWith('image/')) {
                this.showNotification(`File "${file.name}" is not an image`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const previewId = `preview-${Date.now()}-${index}`;
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.id = previewId;
                previewItem.dataset.fileIndex = index;
                previewItem.innerHTML = `
                    <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb; background: #f8fafc;">
                        <img src="${event.target.result}" alt="Preview" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                        <button type="button" class="remove-image-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1;">×</button>
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 4px; font-size: 10px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(file.name)}</div>
                    </div>
                `;
                container.appendChild(previewItem);

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
        imageUrls.forEach((url) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'existing-image-item';
            previewItem.dataset.imageUrl = url;
            previewItem.innerHTML = `
                <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #10b981; background: #f8fafc;">
                    <img src="${url}" alt="Existing" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                    <button type="button" class="remove-existing-image-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1;">×</button>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(16, 185, 129, 0.8); color: white; padding: 4px; font-size: 10px; text-align: center;">Existing</div>
                </div>
            `;
            container.appendChild(previewItem);

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

        let removedImages = [];
        try {
            const existing = document.getElementById('removed-images');
            if (existing && existing.value) {
                removedImages = JSON.parse(existing.value);
            }
        } catch (e) {
            removedImages = [];
        }

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

        const removedInput = document.getElementById('removed-images');
        if (removedInput) removedInput.remove();

        const imagesInput = document.getElementById('product-images');
        if (imagesInput) imagesInput.value = '';
    }

    generateSlugFromTitle(e) {
        const title = e.target.value;
        const slugInput = document.getElementById('product-sku');
        if (slugInput && !slugInput.value) {
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            slugInput.value = slug;
        }
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (!modal) return;

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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '99999999',
            backgroundColor: colors[type] || colors.info,
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '400px',
            wordWrap: 'break-word',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

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

window.closeProductModal = function() {
    if (window.adminProducts) {
        window.adminProducts.closeProductModal();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    function waitForSharedAuth() {
        if (window.sharedAdminAuth) {
            try {
                window.adminProducts = new AdminProducts();
            } catch (error) {
                console.error('Failed to initialize AdminProducts:', error);
            }
        } else {
            setTimeout(waitForSharedAuth, 100);
        }
    }
    waitForSharedAuth();
});
