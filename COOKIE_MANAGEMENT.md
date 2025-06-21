# Cookie Revoking System for Laravel SSR App Deployments

This system automatically handles cookie revoking when you deploy updates to your Laravel SSR application in production. This ensures users get a clean authentication state after app updates.

## How It Works

### 1. Automatic Cookie Revoking (Recommended)

The system uses a middleware (`RevokeCookiesOnUpdate`) that:
- Checks for app version changes on each request
- Automatically revokes cookies when a new version is detected
- Caches the version to avoid repeated checks

### 2. Manual Cookie Revoking

You can also manually revoke cookies using:
- API endpoint: `POST /revoke-cookies`
- Controller method: `AuthenticatedSessionController@revokeCookies()`
- Frontend utility: `CookieManager.revokeCookies()`

## Setup Instructions

### 1. Environment Configuration

Add your app version to the `.env` file:
```bash
APP_VERSION=1.0.0
```

### 2. Deployment Process

During deployment, update the app version:

```bash
# Using git commit hash
APP_VERSION=$(git rev-parse --short HEAD)

# Using timestamp
APP_VERSION=$(date +%s)

# Using semantic version
APP_VERSION="1.2.3"

# Update .env file
sed -i "s/APP_VERSION=.*/APP_VERSION=$APP_VERSION/" .env

# Clear config cache to pick up changes
php artisan config:cache
```

### 3. Frontend Integration

The frontend automatically:
- Checks for version changes on page load
- Revokes cookies when needed
- Stores version in localStorage for comparison

## Usage Examples

### Automatic (Middleware)
```php
// Middleware runs on every web request
// Automatically detects version changes
// Revokes cookies when version changes
```

### Manual (Controller)
```php
// In any controller
$this->revokeCookies();

// Or call the endpoint
POST /revoke-cookies
```

### Frontend (JavaScript)
```javascript
import { CookieManager } from '@/utils/cookie-manager';

// Manually revoke cookies
await CookieManager.revokeCookies();

// Clear all cookies (client-side fallback)
CookieManager.clearAllCookies();

// Check version and handle automatically
await CookieManager.initialize();
```

## Deployment Script

Use the provided `deploy.sh` script for automated deployments:

```bash
./deploy.sh
```

This script:
- Updates the app version
- Builds the application
- Clears caches
- Handles cookie revoking automatically

## What Cookies Are Revoked

The system revokes these cookies:
- `laravel_session`
- `XSRF-TOKEN`
- Session cookies (based on config)
- Remember tokens
- Any other authentication-related cookies

**Preserved cookies:**
- `timezone`
- `locale`
- `theme`

## Benefits

1. **Clean State**: Users get fresh authentication after updates
2. **Automatic**: No manual intervention required
3. **Safe**: Preserves essential user preferences
4. **Flexible**: Multiple ways to trigger cookie revoking
5. **Production-Ready**: Handles deployment scenarios

## Troubleshooting

### Cookies Not Being Revoked
- Check if `APP_VERSION` is properly set
- Verify middleware is registered in `app/Http/Kernel.php`
- Clear config cache: `php artisan config:cache`

### Version Not Updating
- Ensure `.env` file has correct `APP_VERSION`
- Check config cache is cleared after deployment
- Verify meta tag is present in HTML: `<meta name="app-version" content="...">`

### Frontend Errors
- Check browser console for JavaScript errors
- Verify route name exists: `route('auth.revoke-cookies')`
- Ensure CSRF token is valid for API calls
