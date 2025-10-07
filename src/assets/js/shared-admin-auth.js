/**
 * Shared Admin Authentication System
 * Provides consistent authentication across all admin pages
 */

class SharedAdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.init();
    }

    init() {
        this.checkStoredAuth();
    }

    checkStoredAuth() {
        const token = localStorage.getItem('admin_token');
        if (token) {
            this.authToken = token;
            this.isAuthenticated = true;
            console.log('Admin authentication restored from storage');
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
