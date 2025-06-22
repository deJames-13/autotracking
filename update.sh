#!/bin/bash
echo "Pulling latest changes from GitHub..."
git pull origin main

echo "Installing Composer dependencies..."
composer install --optimize-autoloader

echo "Installing npm dependencies and building assets..."
npm install
npm run build

echo "Running Laravel migrations..."
php artisan migrate --force

echo "Clearing and caching configurations..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Restarting Inertia SSR server (if applicable)..."
pm2 restart inertia-ssr
nohup php artisan queue:work --verbose > queue.log 2>&1 &
echo "Update complete!"





















