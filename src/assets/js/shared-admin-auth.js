/**
 * Shared Admin Authentication System
 * Provides consistent authentication across all admin pages
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isNetlify = window.location.hostname.includes('netlify.app');

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
        console.log('SharedAdminAuth initializing...');
        // On initialization, we only check if *a* token exists and is valid.
        // We do NOT clear the token here, even if expired.
        this.readAndValidateToken();
    }

    /**
     * Reads auth data from local storage and validates it.
     * Crucially, it does NOT clear the expired token.
     * @returns {boolean} True if a valid, unexpired token was found.
     */
    readAndValidateToken() {
        const token = localStorage.getItem('admin_token');
        const tokenExpiry = localStorage.getItem('admin_token_expiry');
        
        this.isAuthenticated = false;
        this.authToken = null;

        if (token && tokenExpiry) {
            const now = Date.now();
            const expiry = parseInt(tokenExpiry);
            
            if (now < expiry) {
                this.authToken = token;
                this.isAuthenticated = true;
                console.log('✅ Auth state established from valid stored token.');
                return true;
            } else {
                // Token is expired, but we keep it in storage for now.
                console.log('⚠️ Stored token is expired, but not cleared yet.');
                // We could set this.authToken here if we wanted the expired token for a refresh call.
                return false; 
            }
        }
        console.log('ℹ️ No token found or expiry data missing.');
        return false;
    }

    /**
     * Handles the dummy login process and stores the token.
     * In a real app, this would be an async API call.
     */
    login(email, password) {
        // ... (Keep your existing demo login logic)
        if (email === 'admin@kvgarage.com' && password === 'admin123') {
            const mockToken = 'demo-admin-token-' + Date.now();
            // Token expiry set to 7 days
            const tokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); 
            
            localStorage.setItem('admin_token', mockToken);
            localStorage.setItem('admin_token_expiry', tokenExpiry.toString());
            
            this.authToken = mockToken;
            this.isAuthenticated = true;
            console.log('✅ Admin login successful.');
            return { success: true, token: mockToken };
        } else {
            console.log('❌ Login failed: Invalid credentials');
            return { success: false, error: 'Invalid credentials. Use admin@kvgarage.com / admin123' };
        }
    }

    /**
     * Clears local storage and internal state on explicit user logout.
     */
    logout() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.clearStoredAuth();
        console.log('✅ Admin logout successful and data cleared.');
    }

    /**
     * Clears authentication data from Local Storage.
     * This is now ONLY called by logout().
     */
    clearStoredAuth() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    getToken() {
        return this.authToken;
    }

    /**
     * Determines if the AdminPacks class should attempt to use stored auth.
     * This replaces the redundant autoLogin/shouldAutoLogin functions.
     */
    shouldAutoLogin() {
        // Simply return the current state, which was set in init()
        // OR read/validate it again if needed (as the state might be stale)
        return this.readAndValidateToken();
    }
}

// Create global instance (only if it doesn't exist)
if (!window.sharedAdminAuth) {
    window.sharedAdminAuth = new SharedAdminAuth();
} else {
    console.log('SharedAdminAuth instance already exists, re-validating...');
    window.sharedAdminAuth.readAndValidateToken();
}


// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedAdminAuth;
}
