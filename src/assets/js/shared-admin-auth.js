/**
 * Shared Admin Authentication System
 * Provides consistent authentication across all admin pages
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isNetlify = window.location.hostname.includes('netlify.app');

// API Configuration - make it globally available
window.API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';
const API_BASE_URL = window.API_BASE_URL;

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
     * Attempts to refresh expired tokens automatically.
     * @returns {boolean} True if a valid, unexpired token was found or refreshed.
     */
    async readAndValidateToken() {
        const token = localStorage.getItem('admin_token');
        const tokenExpiry = localStorage.getItem('admin_token_expiry');
        
        this.isAuthenticated = false;
        this.authToken = null;

        if (token && tokenExpiry) {
            const now = Date.now();
            const expiry = parseInt(tokenExpiry);
            
            if (now < expiry) {
                // Token is still valid according to localStorage
                this.authToken = token;
                this.isAuthenticated = true;
                console.log('✅ Auth state established from valid stored token.');
                return true;
            } else {
                // Token is expired, try to refresh it
                console.log('⚠️ Stored token is expired, attempting refresh...');
                return await this.refreshToken(token);
            }
        }
        console.log('ℹ️ No token found or expiry data missing.');
        return false;
    }

    /**
     * Attempts to refresh an expired token using the API
     * @param {string} expiredToken - The expired token to refresh
     * @returns {boolean} True if refresh was successful
     */
    async refreshToken(expiredToken) {
        try {
            console.log('Attempting to refresh expired token...');
            
            const response = await fetch(`${API_BASE_URL}/admin/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${expiredToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Update stored token and expiry
                    localStorage.setItem('admin_token', data.token);
                    const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
                    localStorage.setItem('admin_token_expiry', tokenExpiry.toString());
                    
                    this.authToken = data.token;
                    this.isAuthenticated = true;
                    
                    console.log('✅ Token refreshed successfully');
                    return true;
                }
            }
            
            // If refresh failed, clear the expired token
            console.log('❌ Token refresh failed, clearing expired token');
            this.clearStoredAuth();
            return false;
            
        } catch (error) {
            console.error('❌ Token refresh error:', error);
            this.clearStoredAuth();
            return false;
        }
    }

    /**
     * Handles real API login process
     */
    async login(email, password) {
        try {
            console.log('Attempting login with API...');
            
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user info
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                
                // Set expiry (24 hours from now)
                const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
                localStorage.setItem('admin_token_expiry', tokenExpiry.toString());
                
                this.authToken = data.token;
                this.isAuthenticated = true;
                
                console.log('✅ Admin login successful via API');
                return { success: true, token: data.token, user: data.user };
            } else {
                console.log('❌ Login failed:', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: 'Login failed. Please check your connection.' };
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
        localStorage.removeItem('admin_user');
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
    async shouldAutoLogin() {
        // Read and validate token (with automatic refresh if needed)
        return await this.readAndValidateToken();
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
