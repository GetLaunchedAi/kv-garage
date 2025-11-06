/**
 * Lightbox Component for Product and Pack Images
 * Opens images in a fullscreen lightbox with navigation support
 */

class ImageLightbox {
  constructor() {
    this.lightbox = null;
    this.currentImageIndex = 0;
    this.images = [];
    this.isOpen = false;
    
    this.init();
  }

  init() {
    // Create lightbox HTML structure
    this.createLightboxHTML();
    
    // Bind events
    this.bindEvents();
    
    // Make existing images clickable
    this.attachToExistingImages();
    
    // Use MutationObserver to handle dynamically loaded images
    this.observeDynamicContent();
  }

  createLightboxHTML() {
    const lightboxHTML = `
      <div id="image-lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Image lightbox" style="display: none;">
        <div class="lightbox-overlay" aria-label="Close lightbox"></div>
        <div class="lightbox-container">
          <button class="lightbox-close" aria-label="Close lightbox" title="Close (Esc)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button class="lightbox-prev" aria-label="Previous image" title="Previous (←)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="lightbox-next" aria-label="Next image" title="Next (→)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div class="lightbox-content">
            <img class="lightbox-image" src="" alt="" />
            <div class="lightbox-caption"></div>
            <div class="lightbox-counter"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    this.lightbox = document.getElementById('image-lightbox');
  }

  bindEvents() {
    // Close button
    this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    
    // Overlay click
    this.lightbox.querySelector('.lightbox-overlay').addEventListener('click', () => this.close());
    
    // Navigation buttons
    this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.prevImage());
    this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.nextImage());
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prevImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
      }
    });
    
    // Prevent body scroll when lightbox is open
    this.observeBodyScroll();
  }

  observeBodyScroll() {
    const observer = new MutationObserver(() => {
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    observer.observe(this.lightbox, { attributes: true, attributeFilter: ['style'] });
  }

  attachToExistingImages() {
    // Attach to product images in shop (but skip images with data-no-lightbox attribute)
    document.querySelectorAll('.card__img img, .pack-image img, .pack-image-large img, #pdpImg, .catalog-image').forEach(img => {
      // Skip images that should not open lightbox (e.g., product card images that link to detail pages)
      if (img.hasAttribute('data-no-lightbox') || img.closest('[data-product-link]')) {
        return;
      }
      this.makeImageClickable(img);
    });
  }

  observeDynamicContent() {
    // Watch for dynamically added images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if the node is an image
            if (node.tagName === 'IMG') {
              if (this.isProductOrPackImage(node) && !node.hasAttribute('data-no-lightbox') && !node.closest('[data-product-link]')) {
                this.makeImageClickable(node);
              }
            }
            // Check for images within the node
            const images = node.querySelectorAll && node.querySelectorAll('img');
            if (images) {
              images.forEach(img => {
                if (this.isProductOrPackImage(img) && !img.hasAttribute('data-no-lightbox') && !img.closest('[data-product-link]')) {
                  this.makeImageClickable(img);
                }
              });
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isProductOrPackImage(img) {
    // Check if image is a product or pack image based on classes or parent classes
    const classes = img.className || '';
    const parentClasses = img.closest('.card__img, .pack-image, .pack-image-large, .pdp__media, .catalog-image')?.className || '';
    
    return classes.includes('catalog-image') ||
           img.id === 'pdpImg' ||
           img.id === 'modal-pack-image' ||
           parentClasses.includes('card__img') ||
           parentClasses.includes('pack-image') ||
           parentClasses.includes('pack-image-large') ||
           parentClasses.includes('pdp__media');
  }

  makeImageClickable(img) {
    // Skip if already clickable
    if (img.classList.contains('lightbox-enabled')) return;
    
    img.classList.add('lightbox-enabled');
    img.style.cursor = 'pointer';
    
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Collect all images in the same context (for navigation)
      const context = this.getImageContext(img);
      const allImages = this.collectImagesFromContext(context);
      
      this.open(img.src, img.alt || '', allImages);
    });
  }

  getImageContext(img) {
    // Determine context: shop products, packs page, etc.
    if (img.closest('.card')) {
      return 'shop-products';
    } else if (img.closest('.pack-card')) {
      return 'packs-page';
    } else if (img.closest('#pdp')) {
      return 'product-detail';
    } else if (img.closest('.pack-detail-page')) {
      return 'pack-detail';
    } else if (img.closest('.catalog-table')) {
      return 'catalog';
    }
    return 'general';
  }

  collectImagesFromContext(context) {
    let images = [];
    
    switch(context) {
      case 'shop-products':
        images = Array.from(document.querySelectorAll('.card__img img.lightbox-enabled'))
          .map(img => ({ src: img.src, alt: img.alt || '' }));
        break;
      case 'packs-page':
        images = Array.from(document.querySelectorAll('.pack-card .pack-image img.lightbox-enabled'))
          .map(img => ({ src: img.src, alt: img.alt || '' }));
        break;
      case 'catalog':
        images = Array.from(document.querySelectorAll('.catalog-image.lightbox-enabled'))
          .map(img => ({ src: img.src, alt: img.alt || '' }));
        break;
      default:
        // For single images, just use that one
        images = [];
    }
    
    return images;
  }

  open(imageSrc, imageAlt = '', imageCollection = []) {
    this.isOpen = true;
    this.images = imageCollection.length > 0 ? imageCollection : [{ src: imageSrc, alt: imageAlt }];
    
    // Find current image index
    this.currentImageIndex = this.images.findIndex(img => img.src === imageSrc);
    if (this.currentImageIndex === -1) {
      this.currentImageIndex = 0;
      this.images[0] = { src: imageSrc, alt: imageAlt };
    }
    
    this.updateLightboxContent();
    this.lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus trap for accessibility
    this.lightbox.querySelector('.lightbox-close').focus();
    
    // Add open class for animation
    setTimeout(() => {
      this.lightbox.classList.add('lightbox-open');
    }, 10);
  }

  close() {
    this.isOpen = false;
    this.lightbox.classList.remove('lightbox-open');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      this.lightbox.style.display = 'none';
    }, 300); // Match CSS transition duration
  }

  updateLightboxContent() {
    const currentImage = this.images[this.currentImageIndex];
    const img = this.lightbox.querySelector('.lightbox-image');
    const caption = this.lightbox.querySelector('.lightbox-caption');
    const counter = this.lightbox.querySelector('.lightbox-counter');
    const prevBtn = this.lightbox.querySelector('.lightbox-prev');
    const nextBtn = this.lightbox.querySelector('.lightbox-next');
    
    // Update image
    img.src = currentImage.src;
    img.alt = currentImage.alt || '';
    
    // Update caption
    if (currentImage.alt) {
      caption.textContent = currentImage.alt;
      caption.style.display = 'block';
    } else {
      caption.style.display = 'none';
    }
    
    // Update counter
    if (this.images.length > 1) {
      counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
      counter.style.display = 'block';
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    } else {
      counter.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
    
    // Update navigation button states
    prevBtn.disabled = this.images.length <= 1;
    nextBtn.disabled = this.images.length <= 1;
  }

  prevImage() {
    if (this.images.length <= 1) return;
    
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.updateLightboxContent();
  }

  nextImage() {
    if (this.images.length <= 1) return;
    
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    this.updateLightboxContent();
  }
}

// Export class for programmatic use
window.ImageLightbox = ImageLightbox;

// Initialize lightbox when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageLightbox = new ImageLightbox();
  });
} else {
  window.imageLightbox = new ImageLightbox();
}

