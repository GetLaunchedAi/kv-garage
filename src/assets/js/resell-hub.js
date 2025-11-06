/**
 * Resell Hub Page JavaScript
 * Handles lead form submission and PDF download
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
    setupLeadForm();
    setupVideoPlaceholder();
  }

  /**
   * Setup lead magnet form
   */
  function setupLeadForm() {
    const form = document.getElementById('resell-lead-form');
    const submitBtn = document.getElementById('lead-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const formContainer = document.querySelector('.lead-form-container');
    const successMessage = document.getElementById('lead-success');
    const manualDownloadLink = document.getElementById('manual-download-link');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');

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
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';

      try {
        // TODO: Add email service integration here
        // Simulate API call delay (remove when real API is connected)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Hide form and show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';

        // Trigger PDF download
        downloadPDF();

      } catch (error) {
        alert('Something went wrong. Please try again.');
        
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
      }
    });
  }

  /**
   * Download the PDF playbook
   */
  function downloadPDF() {
    const pdfUrl = '/assets/pdf/kv-resell-playbook.pdf';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'kv-resell-playbook.pdf';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also update the manual download link href
    const manualLink = document.getElementById('manual-download-link');
    if (manualLink) {
      manualLink.href = pdfUrl;
    }
  }

  /**
   * Setup video placeholder visibility
   * Hide placeholder if video URL is properly set
   */
  function setupVideoPlaceholder() {
    const videoIframe = document.getElementById('resell-video-iframe');
    const placeholder = document.getElementById('video-placeholder');
    const videoWrapper = document.querySelector('.video-wrapper');

    if (!videoIframe || !placeholder || !videoWrapper) return;

    // Check if video URL contains actual video ID (not placeholder)
    const videoSrc = videoIframe.getAttribute('src');
    if (videoSrc && !videoSrc.includes('VIDEO_ID') && videoSrc.includes('youtube.com')) {
      // Video is set, hide placeholder and show iframe
      placeholder.style.display = 'none';
      videoIframe.style.display = 'block';
    } else {
      // Video not set, show placeholder and hide iframe
      placeholder.style.display = 'flex';
      videoIframe.style.display = 'none';
    }
  }

  /**
   * Helper function to validate email
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

})();

