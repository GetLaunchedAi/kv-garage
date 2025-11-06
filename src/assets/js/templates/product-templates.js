/**
 * Product Template Functions
 * Reusable templates for rendering products across the site
 */

(function() {
  'use strict';

  // Configuration
  const IS_PROD = /^(www\.)?kvgarage\.com$/.test(location.hostname);
  const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

  // Utility functions
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));

  const money = v => (Number(v) || 0).toFixed(2);

  const productUrl = p => IS_PROD
    ? `/products/${encodeURIComponent(p.slug || p.id)}/`
    : `/product/?slug=${encodeURIComponent(p.slug || p.id)}`;

  /**
   * Render product card HTML
   * @param {Object} product - Product object
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  window.ProductTemplates = {
    /**
     * Product card template
     */
    card(product, options = {}) {
      const opts = {
        showDescription: options.showDescription !== false,
        showStatus: options.showStatus !== false,
        showCategory: options.showCategory || false,
        ...options
      };

      const productId = product.id || product.slug || product.title?.toLowerCase().replace(/\s+/g, '-');
      const productName = product.title || product.name || 'Product';
      const productSlug = product.slug || productId;
      const productPrice = product.price ?? product.base_price ?? 0;
      const productImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : PLACEHOLDER);
      const productDescription = product.description || '';
      const productStatus = product.status || '';
      const isOutOfStock = product.inStock === false || productPrice === 0;
      const href = productUrl(product);

      // Status badge
      const statusBadge = (opts.showStatus && productStatus)
        ? `<span class="status-badge status-${productStatus.toLowerCase().replace(/\s+/g, '-')}">${esc(productStatus)}</span>`
        : '';

      // Price display
      let priceDisplay = '';
      if (isOutOfStock) {
        priceDisplay = 'Out of Stock';
      } else if (product.quantity && productStatus === 'Wholesale Deal') {
        priceDisplay = `$${money(productPrice)} ${product.currency || 'USD'} (${esc(product.quantity)})`;
      } else {
        priceDisplay = `$${money(productPrice)} ${product.currency || 'USD'}`;
      }

      // Add to cart button
      const addToCartButton = `
        <button 
          class="add-to-cart ${isOutOfStock ? 'disabled' : ''}" 
          ${isOutOfStock ? 'disabled' : ''}
          data-pack-id="${esc(productId)}"
          data-pack-name="${esc(productName)}"
          data-pack-price="${productPrice}"
          data-pack-image="${esc(productImage)}"
          data-pack-slug="${esc(productSlug)}">
          ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      `;

      return `
        <article class="card ${isOutOfStock ? 'out-of-stock' : ''}">
          <a href="${esc(href)}" class="card__link" data-product-link>
            <picture class="card__img">
              <img src="${esc(productImage)}" alt="${esc(productName)}" loading="lazy" decoding="async" data-no-lightbox>
              ${statusBadge}
            </picture>
          </a>
          <div class="card__content">
            <h3 class="card__title">
              <a href="${esc(href)}" data-product-link>${esc(productName)}</a>
            </h3>
            <p class="card__price">${priceDisplay}</p>
            ${opts.showDescription && productDescription ? `<p class="card__description">${esc(productDescription)}</p>` : ''}
            ${addToCartButton}
          </div>
        </article>
      `;
    },

    /**
     * Product list item (for table/list views)
     */
    listItem(product, options = {}) {
      const productId = product.id || product.slug || product.title?.toLowerCase().replace(/\s+/g, '-');
      const productName = product.title || product.name || 'Product';
      const productSlug = product.slug || productId;
      const productPrice = product.price ?? product.base_price ?? 0;
      const productImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : PLACEHOLDER);
      const href = productUrl(product);
      const isOutOfStock = product.inStock === false || productPrice === 0;

      return `
        <tr class="product-row ${isOutOfStock ? 'out-of-stock' : ''}">
          <td class="product-image">
            <img src="${esc(productImage)}" alt="${esc(productName)}" loading="lazy">
          </td>
          <td class="product-name">
            <a href="${esc(href)}">${esc(productName)}</a>
          </td>
          <td class="product-category">${esc(product.category || '')}</td>
          <td class="product-price">$${money(productPrice)}</td>
          <td class="product-action">
            <button 
              class="add-to-cart ${isOutOfStock ? 'disabled' : ''}" 
              ${isOutOfStock ? 'disabled' : ''}
              data-pack-id="${esc(productId)}"
              data-pack-name="${esc(productName)}"
              data-pack-price="${productPrice}"
              data-pack-image="${esc(productImage)}"
              data-pack-slug="${esc(productSlug)}">
              ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </td>
        </tr>
      `;
    },

    /**
     * Related product card (smaller, for carousels)
     */
    relatedCard(product) {
      const productId = product.id || product.slug || product.title?.toLowerCase().replace(/\s+/g, '-');
      const productName = product.title || product.name || 'Product';
      const productSlug = product.slug || productId;
      const productPrice = product.price ?? product.base_price ?? 0;
      const productImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : PLACEHOLDER);
      const href = productUrl(product);

      return `
        <article class="rel-card">
          <a class="rel-card__img" href="${esc(href)}">
            <img src="${esc(productImage)}" alt="${esc(productName)}" loading="lazy">
          </a>
          <div class="rel-card__content">
            <h3 class="rel-card__title">
              <a href="${esc(href)}">${esc(productName)}</a>
            </h3>
            <div class="rel-card__price">$${money(productPrice)}</div>
            <button class="rel-card__cta add-to-cart" 
                    data-pack-id="${esc(productId)}"
                    data-pack-name="${esc(productName)}"
                    data-pack-price="${productPrice}"
                    data-pack-image="${esc(productImage)}"
                    data-pack-slug="${esc(productSlug)}">
              Add to cart
            </button>
          </div>
        </article>
      `;
    },

    /**
     * Render multiple products as cards
     */
    renderCards(products, container, options = {}) {
      if (!container) return;
      container.innerHTML = products.map(p => this.card(p, options)).join('');
    },

    /**
     * Render products as list items
     */
    renderList(products, container, options = {}) {
      if (!container) return;
      container.innerHTML = products.map(p => this.listItem(p, options)).join('');
    }
  };
})();

