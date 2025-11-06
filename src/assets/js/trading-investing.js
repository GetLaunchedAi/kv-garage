/**
 * Trading & Investing Page JavaScript
 * Handles mentorship form submission
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupMentorshipForm();
  }

  /**
   * Setup mentorship form
   */
  function setupMentorshipForm() {
    const form = document.getElementById('mentorship-form');
    const submitBtn = document.getElementById('mentor-submit-btn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;
    const formContainer = document.querySelector('.mentorship-form-container');
    const successMessage = document.getElementById('mentorship-success');

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
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

})();

