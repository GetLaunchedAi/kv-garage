/**
 * Global Cart System for KV Garage (Fixed)
 * Handles cart functionality across all pages
 */
class GlobalCart {
  constructor() {
    this.cart = this.loadCart();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCartDisplay();
  }

  bindEvents() {
    // Add to cart buttons (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (btn) {
        e.preventDefault();
        this.addToCart(btn);
      }
    });

    // Remove item buttons (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-item');
      if (btn) {
        e.preventDefault();
        this.removeFromCart(btn.dataset.id);
      }
    });

    // Toggle cart modal
    const cartToggle = document.querySelector('.cart-toggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', () => this.toggleCart());
    }

    // Checkout button
    const checkoutBtn = document.querySelector('.cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.checkout());
    }
  }

  addToCart(button) {
    const packId = String(button.dataset.packId);
    const packName = button.dataset.packName || 'Unnamed Pack';
    const packPrice = parseFloat(button.dataset.packPrice) || 0;
    const packImage = button.dataset.packImage || '/images/default.png';
    const packSlug = button.dataset.packSlug || '';

    // find existing item
    const existing = this.cart.find(i => i.id === packId);

    if (existing) {
      existing.quantity += 1;
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

  addPackToCart(pack, actionType) {
    const cartItem = {
      id: String(pack.id),
      name: pack.name,
      price: actionType === 'reserve' ? pack.deposit_price : pack.price,
      image: pack.image_url || '/images/products/collage_1.png',
      slug: pack.slug || pack.name.toLowerCase().replace(/\s+/g, '-'),
      quantity: 1,
      type: actionType === 'reserve' ? 'reservation' : 'purchase',
      depositAmount: actionType === 'reserve' ? pack.deposit_price : 0,
      fullAmount: pack.price,
      originalAction: actionType
    };

    // Check if item already exists (same pack + same type)
    const existing = this.cart.find(i => i.id === cartItem.id && i.type === cartItem.type);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push(cartItem);
    }

    this.saveCart();
    this.updateCartDisplay();
    this.showAddToCartFeedback();
  }

  showAddToCartFeedback(button) {
    if (button) {
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Added!';
      button.classList.add('added');

      setTimeout(() => {
        button.textContent = original;
        button.classList.remove('added');
        button.disabled = false;
      }, 1200);
    } else {
      // Show toast notification for pack additions
      this.showToast('Item added to cart!');
    }
  }

  showToast(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  updateCartDisplay() {
    const count = this.getTotalItems();
    const total = this.getTotalPrice();

    const countEl = document.querySelector('.cart-count');
    if (countEl) {
      countEl.textContent = count;
      countEl.style.display = count > 0 ? 'inline-block' : 'none';
    }

    const totalEl = document.querySelector('.cart-total-amount');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    this.renderCartItems();
  }

  renderCartItems() {
    const container = document.querySelector('.cart-items');
    if (!container) return;

    if (!this.cart.length) {
      container.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
      return;
    }

    container.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
  }

  createCartItemHTML(item) {
    const isReservation = item.type === 'reservation';
    const itemId = `${item.id}-${item.type || 'purchase'}`;
    
    return `
      <div class="cart-item ${item.type || ''}" data-id="${itemId}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4 class="cart-item-name">
            ${isReservation ? `🔒 Reservation for ${item.name}` : item.name}
          </h4>
          <p class="cart-item-price">
            ${isReservation 
              ? `Deposit: $${item.price.toFixed(2)} (Full: $${item.fullAmount.toFixed(2)})`
              : `$${item.price.toFixed(2)}`
            }
          </p>
          <div class="quantity-controls">
            <button onclick="window.globalCart.decreaseQuantity('${item.id}', '${item.type || 'purchase'}')">-</button>
            <span class="quantity">${item.quantity}</span>
            <button onclick="window.globalCart.increaseQuantity('${item.id}', '${item.type || 'purchase'}')">+</button>
          </div>
        </div>
        <button class="remove-item" data-id="${itemId}" title="Remove">×</button>
      </div>
    `;
  }

  removeFromCart(id) {
    // Handle both old format (just id) and new format (id-type)
    if (id.includes('-')) {
      const [itemId, itemType] = id.split('-');
      this.cart = this.cart.filter(item => !(item.id === itemId && (item.type || 'purchase') === itemType));
    } else {
      this.cart = this.cart.filter(item => item.id !== String(id));
    }
    this.saveCart();
    this.updateCartDisplay();
  }

  increaseQuantity(itemId, itemType) {
    const item = this.cart.find(i => i.id === itemId && (i.type || 'purchase') === itemType);
    if (item) {
      item.quantity += 1;
      this.saveCart();
      this.updateCartDisplay();
    }
  }

  decreaseQuantity(itemId, itemType) {
    const item = this.cart.find(i => i.id === itemId && (i.type || 'purchase') === itemType);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        this.removeFromCart(`${itemId}-${itemType}`);
      } else {
        this.saveCart();
        this.updateCartDisplay();
      }
    }
  }

  getTotalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  loadCart() {
    try {
      const raw = localStorage.getItem('kv-garage-cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem('kv-garage-cart', JSON.stringify(this.cart));
  }

  toggleCart() {
    const modal = document.querySelector('.cart-modal');
    if (modal) modal.classList.toggle('active');
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartDisplay();
  }

  getCartData() {
    return {
      items: this.cart,
      totalItems: this.getTotalItems(),
      totalPrice: this.getTotalPrice()
    };
  }
async checkout() {
  if (this.cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  try {
    // Prepare cart items for Stripe with metadata
    const cartItems = this.cart.map(item => ({
      id: item.id,
      name: item.type === 'reservation' ? `Reservation for ${item.name}` : item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      metadata: {
        type: item.type || 'purchase',
        originalAction: item.originalAction || 'buy',
        fullAmount: item.fullAmount || item.price,
        depositAmount: item.depositAmount || 0
      }
    }));

    const res = await fetch('/api/create-checkout-session.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems }),
    });

    const text = await res.text();
    console.log("Raw Stripe response:", text);

    const data = JSON.parse(text);
    if (!data.ok || !data.url) throw new Error(data.error || 'Invalid Stripe response.');

    window.location.href = data.url; // ✅ safe redirect
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    alert("❌ Failed to start Stripe checkout. See console for details.");
  }
}


}

document.addEventListener('DOMContentLoaded', () => {
  window.globalCart = new GlobalCart();
});
