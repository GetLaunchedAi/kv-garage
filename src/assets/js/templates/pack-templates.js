/**
 * Pack Template Functions
 * Reusable templates for rendering packs across the site
 */

(function() {
  'use strict';

  // Utility functions
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));

  const money = v => (Number(v) || 0).toFixed(2);

  /**
   * Render pack card HTML
   */
  window.PackTemplates = {
    /**
     * Pack card template
     */
    card(pack, options = {}) {
      const opts = {
        showDescription: options.showDescription !== false,
        showStats: options.showStats !== false,
        showStockBadge: options.showStockBadge !== false,
        ...options
      };

      const packId = pack.id || pack.slug;
      const packName = pack.name || 'Pack';
      const packSlug = pack.slug || packId;
      const packImage = pack.image_url || pack.image || '/images/products/collage_1.png';
      const packPrice = pack.price || 0;
      const packType = pack.type || 'standard';
      const packStatus = pack.status || 'available';
      const availableQty = pack.available_quantity || 0;
      const isLowStock = availableQty <= 5;
      const isOutOfStock = availableQty === 0;
      const isLimited = packStatus === 'limited' && availableQty > 0;
      const packDescription = pack.short_description || pack.description || '';
      const resaleValue = pack.estimated_resale_value || '$0';
      const units = pack.number_of_units || pack.units || 0;
      const depositPrice = pack.deposit_price || 0;

      return `
        <div class="pack-card ${isOutOfStock ? 'out-of-stock' : ''}" data-pack-id="${packId}">
          <div class="pack-image">
            <img src="${esc(packImage)}" alt="${esc(packName)}" loading="lazy">
            ${opts.showStockBadge && isLimited ? `<div class="stock-badge limited">Limited — ${availableQty} left</div>` : ''}
            ${opts.showStockBadge && isOutOfStock ? `<div class="stock-badge out-of-stock">Sold Out</div>` : ''}
          </div>
          
          <div class="pack-content">
            <div class="pack-header">
              <h3 class="pack-name">${esc(packName)}</h3>
              <span class="pack-type">${esc(packType.toUpperCase())}</span>
            </div>
            
            <div class="pack-pricing">
              <div class="price-row">
                <span class="price-label">Your Cost:</span>
                <span class="price-value">$${money(packPrice)}</span>
              </div>
              <div class="price-row">
                <span class="price-label">Est. Resale:</span>
                <span class="price-value profit">${esc(resaleValue)}</span>
              </div>
            </div>
            
            ${opts.showStats ? `
              <div class="pack-stats">
                <div class="stat">
                  <span class="stat-label">Units in Pack:</span>
                  <span class="stat-value">${units}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Available Now:</span>
                  <span class="stat-value available-count">${availableQty}</span>
                </div>
              </div>
            ` : ''}
            
            ${opts.showDescription && packDescription ? `<p class="pack-description">${esc(packDescription)}</p>` : ''}
            
            <div class="pack-actions">
              <button class="pack-btn expand-toggle" data-action="expand" data-pack-id="${esc(packId)}" aria-label="View items in pack">
                <span class="expand-icon">▼</span>
                <span class="expand-text">View Items</span>
              </button>
              <a href="/pack/${esc(packSlug)}/" class="pack-btn primary">View Details</a>
              ${!isOutOfStock ? `
                <button class="pack-btn buy add-to-cart" 
                        data-pack-id="${esc(packId)}"
                        data-pack-name="${esc(packName)}"
                        data-pack-price="${packPrice}"
                        data-pack-image="${esc(packImage)}"
                        data-pack-slug="${esc(packSlug)}">
                  Buy Now ($${money(packPrice)})
                </button>
              ` : ''}
            </div>
          </div>
          
          <!-- Expandable Items Section -->
          <div class="pack-items-container" data-pack-items="${esc(packId)}" style="display: none;">
            <div class="pack-items-loading" style="display: none;">
              <div class="spinner-small"></div>
              <p>Loading items...</p>
            </div>
            <div class="pack-items-content"></div>
          </div>
        </div>
      `;
    },

    /**
     * Pack table row (for homepage catalog table)
     */
    tableRow(pack) {
      const packId = pack.id || pack.slug;
      const packName = pack.name || 'Pack';
      const packSlug = pack.slug || packId;
      const packImage = pack.image_url || pack.image || '/images/products/collage_1.png';
      const packPrice = pack.price || 0;
      const units = pack.number_of_units || pack.units || 0;
      const packDescription = pack.short_description || pack.description || '';
      const resaleValue = pack.estimated_resale_value || '$0';
      const availableQty = pack.available_quantity || 0;
      const isOutOfStock = availableQty === 0;

      return `
        <tr class="catalog-row fx slide-top">
          <td class="pack-name">
            <strong>${esc(packName)}</strong>
          </td>
          <td class="pack-price">
            <span class="price">$${money(packPrice)}</span>
          </td>
          <td class="pack-units">
            ~${units}
          </td>
          <td class="pack-contents">
            ${esc(packDescription)}
          </td>
          <td class="pack-resale">
            <span class="resale-value">${esc(resaleValue)}</span>
          </td>
          <td class="pack-image">
            <img 
              src="${esc(packImage)}" 
              alt="${esc(packName)}"
              loading="lazy"
              decoding="async"
              class="catalog-image">
          </td>
          <td class="pack-action">
            <button 
              class="add-to-cart cs-button-solid catalog-btn ${isOutOfStock ? 'disabled' : ''}"
              ${isOutOfStock ? 'disabled' : ''}
              data-pack-id="${esc(packId)}"
              data-pack-name="${esc(packName)}"
              data-pack-price="${packPrice}"
              data-pack-image="${esc(packImage)}"
              data-pack-slug="${esc(packSlug)}">
              ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          </td>
        </tr>
      `;
    },

    /**
     * Related pack card (smaller, for detail pages)
     */
    relatedCard(pack) {
      const packId = pack.id || pack.slug;
      const packName = pack.name || 'Pack';
      const packSlug = pack.slug || packId;
      const packImage = pack.image_url || pack.image || '/images/products/collage_1.png';
      const packPrice = pack.price || 0;
      const packType = pack.type || 'standard';
      const resaleValue = pack.estimated_resale_value || '$0';
      const availableQty = pack.available_quantity || 0;
      const isOutOfStock = availableQty === 0;

      // Calculate estimated profit from resale value range (handle both en dash and hyphen)
      const profitMatch = resaleValue.match(/\$([0-9,]+)[–-]\$([0-9,]+)/);
      let profitDisplay = '';
      if (profitMatch) {
        const min = parseFloat(profitMatch[1].replace(/,/g, '')) - packPrice;
        const max = parseFloat(profitMatch[2].replace(/,/g, '')) - packPrice;
        profitDisplay = `$${money(min)}-$${money(max)}`;
      }

      return `
        <div class="pack-card">
          <div class="pack-image">
            <img src="${esc(packImage)}" alt="${esc(packName)}" loading="lazy">
          </div>
          <div class="pack-content">
            <div class="pack-header">
              <h3 class="pack-name">${esc(packName)}</h3>
              <span class="pack-type">${esc(packType.toUpperCase())}</span>
            </div>
            <div class="pack-pricing">
              <div class="price-row">
                <span class="price-label">Your Cost:</span>
                <span class="price-value">$${money(packPrice)}</span>
              </div>
              <div class="price-row">
                <span class="price-label">Est. Profit:</span>
                <span class="price-value profit">${profitDisplay || 'N/A'}</span>
              </div>
            </div>
            <div class="pack-actions">
              <a href="/pack/${esc(packSlug)}/" class="pack-btn primary">View Details</a>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Render multiple packs as cards
     */
    renderCards(packs, container, options = {}) {
      if (!container) return;
      container.innerHTML = packs.map(p => this.card(p, options)).join('');
    },

    /**
     * Render packs as table rows
     */
    renderTable(packs, container) {
      if (!container) return;
      container.innerHTML = packs.map(p => this.tableRow(p)).join('');
    }
  };
})();

