/**
 * Partner & Invest Page Functionality
 * Handles partnership form submission and validation
 */

const API_BASE_URL = 'http://localhost:3001/api';

class PartnerInvestManager {
    constructor() {
        this.form = document.getElementById('partner-form-element');
        this.successMessage = document.getElementById('partner-success');
        this.init();
    }

    init() {
        if (!this.form) return;
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Phone number formatting
        const phoneInput = document.getElementById('partner-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }

        // Real-time validation
        const inputs = this.form?.querySelectorAll('input, select, textarea');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupFormValidation() {
        // Add validation rules
        this.validationRules = {
            name: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Please enter a valid name'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: true,
                pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                message: 'Please enter a valid phone number'
            },
            company: {
                required: false,
                minLength: 2,
                message: 'Please enter a valid company name'
            },
            tier: {
                required: true,
                message: 'Please select a partnership tier'
            },
            investment: {
                required: false
            },
            background: {
                required: true,
                minLength: 20,
                message: 'Please provide at least 20 characters about your background and experience'
            },
            goals: {
                required: false
            },
            agreement: {
                required: true,
                message: 'You must agree to the terms and conditions'
            }
        };
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
        }
        
        e.target.value = value;
    }

    validateField(field) {
        const fieldName = field.name;
        const rules = this.validationRules[fieldName];
        
        // Skip validation for optional fields
        if (!rules) return true;

        // Handle checkbox validation
        if (field.type === 'checkbox') {
            const isValid = !rules.required || field.checked;
            this.setFieldValidation(field, isValid, isValid ? '' : rules.message);
            return isValid;
        }

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
        }
        // Pattern validation
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message || 'Please enter a valid value';
        }
        // Min length validation
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message || `Please enter at least ${rules.minLength} characters`;
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    clearFieldError(field) {
        this.setFieldValidation(field, true, '');
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        if (isValid) {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
        } else {
            formGroup.classList.remove('success');
            formGroup.classList.add('error');
        }

        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        if (!isValid && errorMessage) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = errorMessage;
            formGroup.appendChild(errorElement);
        }
    }

    getFieldLabel(fieldName) {
        const labels = {
            name: 'Full Name',
            email: 'Email Address',
            phone: 'Phone Number',
            company: 'Company Name',
            tier: 'Partnership Tier',
            investment: 'Investment Level',
            background: 'Background & Experience',
            goals: 'Partnership Goals',
            agreement: 'Agreement'
        };
        return labels[fieldName] || fieldName;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = this.form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        const formData = new FormData(this.form);
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Please fix the errors above', 'error');
            // Scroll to first error
            const firstError = this.form.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';

        try {
            // Convert FormData to object
            const data = Object.fromEntries(formData.entries());
            
            // Add form type identifier
            data.formType = 'partnership-inquiry';
            data.timestamp = new Date().toISOString();
            
            // Try to submit via form action (submit-form.com)
            // If that fails, try API endpoint
            try {
                // Use form action if available (submit-form.com)
                const formAction = this.form.getAttribute('action');
                if (formAction) {
                    const response = await fetch(formAction, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        this.showSuccess();
                        this.form.reset();
                        this.clearAllValidation();
                        return;
                    }
                }
            } catch (formError) {
            }

            // Fallback to API endpoint
            const response = await fetch(`${API_BASE_URL}/partner-inquiry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess();
                this.form.reset();
                this.clearAllValidation();
            } else {
                throw new Error('Failed to submit partnership inquiry');
            }

        } catch (error) {
            this.showNotification('Failed to submit your inquiry. Please try again or contact us directly at kvgarage@kvgarage.com', 'error');
        } finally {
            // Remove loading state
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'block';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    showSuccess() {
        // Hide form
        if (this.form) {
            this.form.style.display = 'none';
        }
        
        // Show success message
        if (this.successMessage) {
            this.successMessage.style.display = 'block';
            this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            this.showNotification('Thank you! We\'ve received your partnership inquiry. Our team will review your application and get back to you within 48 hours.', 'success');
        }
    }

    clearAllValidation() {
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '99999999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '400px',
            wordWrap: 'break-word',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PartnerInvestManager();
});

