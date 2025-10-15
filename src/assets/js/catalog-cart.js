/**
 * Simple Cart System for KV Garage Catalog
 * Handles adding items to cart and basic cart management
 */

class SimpleCart {
  constructor() {
    this.cart = this.loadCart();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCartDisplay();
  }

  bindEvents() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        e.preventDefault();
        this.addToCart(e.target);
      }
    });

    // Cart toggle (if cart button exists)
    const cartButton = document.querySelector('.cart-toggle');
    if (cartButton) {
      cartButton.addEventListener('click', () => {
        this.toggleCart();
      });
    }
  }

  addToCart(button) {
    const packId = button.dataset.packId;
    const packName = button.dataset.packName;
    const packPrice = parseFloat(button.dataset.packPrice);
    const packImage = button.dataset.packImage;
    const packSlug = button.dataset.packSlug;

    // Check if item already exists in cart
    const existingItem = this.cart.find(item => item.id === packId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: packId,
        name: packName,
        price: packPrice,
        image: packImage,
        slug: packSlug,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartDisplay();
    this.showAddToCartFeedback(button);
  }

  showAddToCartFeedback(button) {
    const originalText = button.textContent;
    button.textContent = 'Added!';
    button.style.backgroundColor = 'var(--primary)';
    button.style.color = '#fff';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      button.style.color = '';
    }, 1500);
  }

  updateCartDisplay() {
    const cartCount = this.getTotalItems();
    const cartTotal = this.getTotalPrice();
    
    // Update cart count in navigation
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
      cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
    }

    // Update cart modal total
    const cartTotalAmount = document.querySelector('.cart-total-amount');
    if (cartTotalAmount) {
      cartTotalAmount.textContent = `$${cartTotal.toFixed(2)}`;
    }

    // Update cart items display (if cart modal exists)
    this.updateCartModal();
  }

  updateCartModal() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;

    if (this.cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      return;
    }

    const cartHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
        </div>
        <button class="remove-item" data-id="${item.id}">×</button>
      </div>
    `).join('');

    cartItemsContainer.innerHTML = cartHTML;

    // Bind remove item events
    cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        this.removeFromCart(e.target.dataset.id);
      });
    });
  }

  removeFromCart(itemId) {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCart();
    this.updateCartDisplay();
  }

  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  loadCart() {
    try {
      const cartData = localStorage.getItem('kv-garage-cart');
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('kv-garage-cart', JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  toggleCart() {
    const cartModal = document.querySelector('.cart-modal');
    if (cartModal) {
      cartModal.classList.toggle('active');
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartDisplay();
  }

  // Method to get cart data for checkout
  getCartData() {
    return {
      items: this.cart,
      totalItems: this.getTotalItems(),
      totalPrice: this.getTotalPrice()
    };
  }

  // Simple checkout function - redirects to contact page with cart data
  checkout() {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Create a simple checkout form data
    const cartData = this.getCartData();
    const checkoutData = {
      items: cartData.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: cartData.totalPrice,
      timestamp: new Date().toISOString()
    };

    // Store checkout data in localStorage for the contact page
    localStorage.setItem('kv-garage-checkout', JSON.stringify(checkoutData));

    // Redirect to contact page for order completion
    window.location.href = '/contact/?checkout=true';
  }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.simpleCart = new SimpleCart();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleCart;
}
