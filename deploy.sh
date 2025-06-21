#!/bin/bash

# Laravel SSR App Deployment Script with Cookie Revoking
# This script demonstrates how to deploy your app and handle cookie revoking

echo "🚀 Starting deployment process..."

# Set the new app version (you can use git commit hash, timestamp, or semantic version)
NEW_VERSION=$(git rev-parse --short HEAD)
# Or use a timestamp: NEW_VERSION=$(date +%s)
# Or use semantic version: NEW_VERSION="1.2.3"

echo "📦 Deploying version: $NEW_VERSION"

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install/update dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader
npm ci --production

# 3. Update configuration cache
echo "⚙️ Updating configuration..."
php artisan config:clear
php artisan config:cache

# 4. Run database migrations (if needed)
echo "🗄️ Running migrations..."
php artisan migrate --force

# 5. Build frontend assets
echo "🏗️ Building frontend assets..."
npm run build

# 6. Update the app version in environment
echo "🏷️ Setting app version..."
# Update .env file with new version
sed -i "s/APP_VERSION=.*/APP_VERSION=$NEW_VERSION/" .env

# Or you can set it directly in the config cache
php artisan config:cache

# 7. Clear all caches
echo "🧹 Clearing caches..."
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 8. Optional: Manually revoke cookies via API endpoint
echo "🍪 Revoking existing cookies..."
# This step is optional since the middleware will handle it automatically
# But you can trigger it manually if needed
curl -X POST "${APP_URL}/revoke-cookies" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" || echo "Cookie revoking endpoint not accessible (normal for fresh deployments)"

# 9. Restart services (if using queue workers, etc.)
echo "🔄 Restarting services..."
# sudo supervisorctl restart laravel-worker:*
# sudo systemctl reload nginx
# sudo systemctl reload php8.3-fpm

# 10. Optimize for production
echo "⚡ Optimizing for production..."
php artisan optimize

echo "✅ Deployment completed successfully!"
echo "🏷️ App version: $NEW_VERSION"
echo "🌐 The new version will automatically revoke old cookies on user's next visit"
echo ""
echo "📋 What happens next:"
echo "   • When users visit the app, the middleware detects the version change"
echo "   • Old cookies are automatically revoked"
echo "   • Users get a fresh authentication state"
echo "   • No manual intervention required!"
