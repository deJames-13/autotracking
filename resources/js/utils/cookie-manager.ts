/**
 * Cookie management utilities for handling app updates and deployments
 */

export class CookieManager {
    /**
     * Revoke all authentication cookies
     * This is useful when deploying updates to ensure clean state
     */
    static async revokeCookies(): Promise<void> {
        try {
            const response = await fetch(route('auth.revoke-cookies'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to revoke cookies');
            }

            console.log('Cookies revoked successfully');
        } catch (error) {
            console.error('Error revoking cookies:', error);
        }
    }

    /**
     * Clear all browser cookies manually (client-side)
     * This is a fallback method when server-side revoking fails
     */
    static clearAllCookies(): void {
        document.cookie.split(";").forEach((cookie) => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Skip essential cookies
            if (!['timezone', 'locale', 'theme'].includes(name)) {
                // Clear cookie for current domain
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                // Clear cookie for domain with leading dot
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            }
        });
    }

    /**
     * Check if app version has changed and handle accordingly
     */
    static async checkAppVersion(): Promise<boolean> {
        try {
            const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
            const storedVersion = localStorage.getItem('app_version');

            if (currentVersion && storedVersion && currentVersion !== storedVersion) {
                console.log('App version changed, revoking cookies...');
                await this.revokeCookies();
                localStorage.setItem('app_version', currentVersion);
                return true; // Version changed
            }

            if (currentVersion && !storedVersion) {
                localStorage.setItem('app_version', currentVersion);
            }

            return false; // No version change
        } catch (error) {
            console.error('Error checking app version:', error);
            return false;
        }
    }

    /**
     * Initialize cookie management on app load
     */
    static async initialize(): Promise<void> {
        const versionChanged = await this.checkAppVersion();
        
        if (versionChanged) {
            // Optionally show a notification about the update
            console.log('Application has been updated. Cookies have been cleared for a fresh start.');
        }
    }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CookieManager.initialize());
    } else {
        CookieManager.initialize();
    }
}
