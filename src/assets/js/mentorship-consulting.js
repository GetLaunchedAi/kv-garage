/**
 * Mentorship & Consulting Page Functionality
 * Handles form submissions for all three service forms
 */

(function() {
  'use strict';

  /**
   * Initialize all form handlers
   */
  function init() {
    setupResellMentorshipForm();
    setupTradingMentorshipForm();
    setupBusinessConsultingForm();
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
   * Setup Resell Mentorship form
   */
  function setupResellMentorshipForm() {
    const form = document.getElementById('resell-mentorship-form');
    const submitBtn = document.getElementById('resell-submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    const successMessage = document.getElementById('resell-success');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const experience = formData.get('experience');
      const message = formData.get('message');

      // Validate required fields
      if (!name || !email) {
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
        // TODO: Add email service integration here
        // For now, we'll just log the data and show success
        console.log('Resell Mentorship request received:', {
          service: 'Resell Mentorship',
          name: name,
          email: email,
          phone: phone || 'N/A',
          experience: experience || 'N/A',
          message: message || 'N/A',
          timestamp: new Date().toISOString()
        });

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
        console.error('Error submitting form:', error);
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
   * Setup Trading Mentorship form
   */
  function setupTradingMentorshipForm() {
    const form = document.getElementById('trading-mentorship-form');
    const submitBtn = document.getElementById('trading-submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    const successMessage = document.getElementById('trading-success');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const experience = formData.get('experience');
      const message = formData.get('message');

      // Validate required fields
      if (!name || !email) {
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
        // TODO: Add email service integration here
        // For now, we'll just log the data and show success
        console.log('Trading Mentorship request received:', {
          service: 'Trading Mentorship',
          name: name,
          email: email,
          phone: phone || 'N/A',
          experience: experience || 'N/A',
          message: message || 'N/A',
          timestamp: new Date().toISOString()
        });

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
        console.error('Error submitting form:', error);
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
   * Setup Business Consulting form
   */
  function setupBusinessConsultingForm() {
    const form = document.getElementById('business-consulting-form');
    const submitBtn = document.getElementById('consulting-submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    const successMessage = document.getElementById('consulting-success');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const business = formData.get('business');
      const focus = formData.get('focus');
      const message = formData.get('message');

      // Validate required fields
      if (!name || !email) {
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
        // TODO: Add email service integration here
        // For now, we'll just log the data and show success
        console.log('Business Consulting request received:', {
          service: 'Business Consulting',
          name: name,
          email: email,
          phone: phone || 'N/A',
          business: business || 'N/A',
          focus: focus || 'N/A',
          message: message || 'N/A',
          timestamp: new Date().toISOString()
        });

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
        console.error('Error submitting form:', error);
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

