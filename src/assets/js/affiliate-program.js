/**
 * Affiliate Program Page Functionality
 * Handles application form submission
 */

(function() {
  'use strict';

  /**
   * Initialize all form handlers
   */
  function init() {
    setupAffiliateApplicationForm();
    setupSmoothScroll();
  }

  /**
   * Setup smooth scroll for anchor links
   */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80; // Account for fixed header
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Setup Affiliate Application form
   */
  function setupAffiliateApplicationForm() {
    const form = document.getElementById('affiliate-application-form');
    const submitBtn = document.getElementById('affiliate-submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    const successMessage = document.getElementById('affiliate-success');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const website = formData.get('website');
      const audience = formData.get('audience');
      const message = formData.get('message');

      // Validate required fields
      if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return;
      }

      // Validate email format
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Show loading state
      if (submitBtn && btnText && btnLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
      }

      try {
        // Save application to JSON file
        const applicationData = {
          id: 'aff_' + Date.now(),
          name: name,
          email: email,
          phone: phone || '',
          website: website || '',
          audience: audience || '',
          message: message,
          status: 'pending', // pending, approved, rejected
          createdAt: new Date().toISOString(),
          approvedAt: null,
          affiliateId: null // Will be set when approved
        };

        // Save to local storage as backup and for admin review
        const applications = JSON.parse(localStorage.getItem('affiliate_applications') || '[]');
        applications.push(applicationData);
        localStorage.setItem('affiliate_applications', JSON.stringify(applications));

        // TODO: Send to backend API endpoint when available
        // For now, we'll just log the data and show success
        console.log('Affiliate application received:', applicationData);

        // Simulate API call delay (remove when real API is connected)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide form and show success message
        form.style.display = 'none';
        if (successMessage) {
          successMessage.style.display = 'block';
        }

        // Scroll to success message
        if (successMessage) {
          successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

      } catch (error) {
        console.error('Error submitting application:', error);
        alert('Something went wrong. Please try again.');
        
        // Reset button state
        if (submitBtn && btnText && btnLoading) {
          submitBtn.disabled = false;
          btnText.style.display = 'block';
          btnLoading.style.display = 'none';
        }
      }
    });
  }

  /**
   * Helper function to validate email
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

