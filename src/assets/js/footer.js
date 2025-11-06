/**
 * Footer Newsletter Form Handler
 * Handles newsletter subscription form submission
 */

(function() {
  'use strict';

  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    const emailInput = document.getElementById('newsletter-email');
    const submitBtn = form.querySelector('.newsletter-submit');

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get email value
      const email = emailInput.value.trim();

      // Validate email
      if (!email) {
        showMessage('Please enter your email address.', 'error');
        emailInput.focus();
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
      }

      // Disable form during submission
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';

      try {
        // Prepare form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.timestamp = new Date().toISOString();

        // Submit to form action (submit-form.com)
        const formAction = form.getAttribute('action');
        if (formAction) {
          const response = await fetch(formAction, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            showMessage('Thank you for subscribing! Check your email for confirmation.', 'success');
            form.reset();
            emailInput.blur();
          } else {
            throw new Error('Failed to subscribe');
          }
        } else {
          throw new Error('Form action not configured');
        }
      } catch (error) {
        showMessage('Something went wrong. Please try again later.', 'error');
      } finally {
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /**
   * Show a temporary message to the user
   */
  function showMessage(message, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.newsletter-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('p');
    messageEl.className = `newsletter-message newsletter-message-${type}`;
    messageEl.textContent = message;
    messageEl.setAttribute('role', 'alert');

    // Insert message after the form
    const form = document.getElementById('newsletter-form');
    if (form) {
      form.appendChild(messageEl);

      // Remove message after 5 seconds
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 5000);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForm);
  } else {
    initNewsletterForm();
  }
})();

