/**
 * Shared Admin Authentication System
 * Provides consistent authentication across all admin pages
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isNetlify = window.location.hostname.includes('netlify.app');

class SharedAdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.init();
    }

    init() {
        console.log('SharedAdminAuth initializing...', {
            isProduction,
            isNetlify,
            hostname: window.location.hostname
        });
        this.checkStoredAuth();
    }

    checkStoredAuth() {
        try {
            const token = localStorage.getItem('admin_token');
            if (token) {
                this.authToken = token;
                this.isAuthenticated = true;
                console.log('Admin authentication restored from storage');
            }
        } catch (error) {
            console.warn('Could not access localStorage:', error);
            this.isAuthenticated = false;
            this.authToken = null;
        }
    }

    login(email, password) {
        // Demo login - in a real app, you'd validate with a server
        if (email === 'admin@kvgarage.com' && password === 'admin123') {
            const mockToken = 'demo-admin-token-' + Date.now();
            localStorage.setItem('admin_token', mockToken);
            this.authToken = mockToken;
            this.isAuthenticated = true;
            console.log('Admin login successful');
            return { success: true, token: mockToken };
        } else {
            return { success: false, error: 'Invalid credentials. Use admin@kvgarage.com / admin123' };
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.authToken = null;
        localStorage.removeItem('admin_token');
        console.log('Admin logout successful');
    }

    isLoggedIn() {
        return this.isAuthenticated && this.authToken !== null;
    }

    getToken() {
        return this.authToken;
    }

    // Auto-login if already authenticated
    autoLogin() {
        if (this.isLoggedIn()) {
            console.log('Auto-login: Already authenticated');
            return true;
        }
        return false;
    }
}

// Create global instance
window.sharedAdminAuth = new SharedAdminAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedAdminAuth;
}
