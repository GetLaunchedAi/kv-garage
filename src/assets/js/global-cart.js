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

  showAddToCartFeedback(button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Added!';
    button.classList.add('added');

    setTimeout(() => {
      button.textContent = original;
      button.classList.remove('added');
      button.disabled = false;
    }, 1200);
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

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
        </div>
        <button class="remove-item" data-id="${item.id}" title="Remove">×</button>
      </div>
    `).join('');
  }

  removeFromCart(id) {
    this.cart = this.cart.filter(item => item.id !== String(id));
    this.saveCart();
    this.updateCartDisplay();
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
    const res = await fetch('/api/create-checkout-session.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: this.cart }),
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
