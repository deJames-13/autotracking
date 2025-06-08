Deploying a Laravel 12 application with Inertia.js and React (with Server-Side Rendering) on Hostinger 
---

### **Prerequisites**
1. **Hostinger VPS Plan**: Ensure you have a VPS plan (e.g., VPS 1 or higher) as shared hosting may not support Node.js or the required configurations for SSR.
2. **Domain/Subdomain**: A domain or subdomain configured in Hostinger’s hPanel and pointing to your VPS.
3. **SSH Access**: Enabled SSH access to your VPS via Hostinger’s hPanel.
4. **Local Development**: A working Laravel 12 application with Inertia.js and React, tested locally with SSR enabled.
5. **Tools**: Basic knowledge of SSH, Composer, npm, and server configuration (Apache/Nginx).

---

### **Step-by-Step Deployment Guide**

#### **1. Set Up the Hostinger VPS**
- **Log in to hPanel**: Navigate to your VPS dashboard in Hostinger.
- **Choose an OS Template**: Select **Ubuntu 22.04 with Laravel** from the OS & Panel → Operating System → Applications section. This template pre-installs Laravel dependencies like PHP and Composer. If not available, choose a clean Ubuntu 22.04 and manually install dependencies (see below).
- **Install Required Software** (if not using the Laravel template):
  - Update the server:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
  - Install PHP 8.2+ (required for Laravel 12):
    ```bash
    sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mbstring php8.2-xml php8.2-zip php8.2-mysql php8.2-curl php8.2-bcmath
    ```
  - Install Composer:
    ```bash
    sudo apt install composer
    ```
  - Install Node.js (for React and SSR):
    ```bash
    sudo apt install nodejs npm
    sudo npm install -g n
    sudo n lts
    ```
  - Install a web server (e.g., Apache or Nginx):
    ```bash
    sudo apt install apache2  # or nginx
    ```
  - Install a database (e.g., MySQL):
    ```bash
    sudo apt install mysql-server
    sudo mysql_secure_installation
    ```

#### **2. Upload Your Laravel Application**
- **Clone or Upload Files**:
  - **Option 1: Git Clone** (Recommended):
    - Set up a Git repository (e.g., GitHub) for your Laravel project.
    - On the VPS, navigate to the desired directory (e.g., `/var/www/laravel`):
      ```bash
      cd /var/www
      sudo git clone <your-repo-url> laravel
      sudo chown -R www-data:www-data laravel
      cd laravel
      ```
  - **Option 2: Upload via SFTP**:
    - Use an SFTP client (e.g., FileZilla) to upload your project files to `/var/www/laravel`.
    - Ensure the `public` folder is accessible (e.g., move its contents to `/var/www/public_html` or configure the web server accordingly).
- **Install PHP Dependencies**:
  - Run Composer to install Laravel dependencies:
    ```bash
    composer install --optimize-autoloader --no-dev
    ```
- **Install Node.js Dependencies**:
  - Install npm dependencies for React and Inertia SSR:
    ```bash
    npm install
    npm run build
    ```
  - This generates the production-ready JavaScript and CSS files in the `public/build` directory.

#### **3. Configure the Environment**
- **Set Up the `.env` File**:
  - Copy the `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
  - Edit `.env` with your database and app settings:
    ```bash
    nano .env
    ```
    Example configuration:
    ```env
    APP_NAME=YourAppName
    APP_ENV=production
    APP_KEY=
    APP_DEBUG=false
    APP_URL=https://your-domain.com

    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=your_database
    DB_USERNAME=your_username
    DB_PASSWORD=your_password
    ```
  - Generate the application key:
    ```bash
    php artisan key:generate
    ```
- **Set Permissions**:
  - Ensure proper ownership and permissions:
    ```bash
    sudo chown -R www-data:www-data /var/www/laravel
    sudo chmod -R 755 /var/www/laravel
    sudo chmod -R 775 /var/www/laravel/storage /var/www/laravel/bootstrap/cache
    ```

#### **4. Configure the Web Server**
- **Apache Configuration**:
  - Create a virtual host configuration:
    ```bash
    sudo nano /etc/apache2/sites-available/laravel.conf
    ```
  - Add the following configuration:
    ```apache
    <VirtualHost *:80>
        ServerName your-domain.com
        DocumentRoot /var/www/laravel/public

        <Directory /var/www/laravel/public>
            Options -Indexes +FollowSymLinks
            AllowOverride All
            Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/laravel-error.log
        CustomLog ${APACHE_LOG_DIR}/laravel-access.log combined
    </VirtualHost>
    ```
  - Enable the site and rewrite module:
    ```bash
    sudo a2ensite laravel.conf
    sudo a2enmod rewrite
    sudo systemctl restart apache2
    ```
- **Nginx Configuration** (if using Nginx):
  - Create a configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/laravel
    ```
  - Add the following:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;
        root /var/www/laravel/public;

        index index.php index.html;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
    ```
  - Enable the site and restart Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

#### **5. Set Up the Database**
- **Create a Database**:
  - Log in to MySQL:
    ```bash
    sudo mysql -u root -p
    ```
  - Create a database and user:
    ```sql
    CREATE DATABASE your_database;
    CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON your_database.* TO 'your_username'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```
- **Run Migrations**:
  - Migrate your database schema:
    ```bash
    php artisan migrate --force
    ```

#### **6. Configure Inertia SSR**
- **Install SSR Dependencies**:
  - Ensure the Inertia SSR package is installed:
    ```bash
    npm install @inertiajs/server @inertiajs/react
    ```
- **Configure Vite for SSR**:
  - Update `vite.config.js` to include React and Laravel plugins:
    ```javascript
    import { defineConfig } from 'vite';
    import laravel from 'laravel-vite-plugin';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
        plugins: [
            laravel({
                input: ['resources/js/app.jsx'],
                refresh: true,
                ssr: 'resources/js/ssr.jsx',
            }),
            react(),
        ],
    });
    ```
- **Create an SSR Entry Point**:
  - Create `resources/js/ssr.jsx`:
    ```javascript
    import { createInertiaApp } from '@inertiajs/react';
    import { createRoot } from 'react-dom/client';

    createInertiaApp({
        resolve: (name) => import(`./Pages/${name}`),
        setup({ el, App, props }) {
            createRoot(el).render(<App {...props} />);
        },
    });
    ```
- **Start the SSR Server**:
  - Build the SSR bundle:
    ```bash
    npm run build:ssr
    ```
  - Run the SSR server using a process manager like PM2:
    ```bash
    sudo npm install -g pm2
    pm2 start artisan --name inertia-ssr --interpreter php -- inertia:start-ssr
    pm2 save
    pm2 startup
    ```
  - This ensures the Node.js-based SSR server runs persistently.

#### **7. Configure Laravel for SSR**
- **Update Inertia Middleware**:
  - Ensure the `HandleInertiaRequests` middleware is registered in `app/Http/Kernel.php` under the `web` middleware group.
- **Enable SSR in Laravel**:
  - In `config/inertia.php`, ensure SSR is enabled:
    ```php
    'ssr' => [
        'enabled' => true,
        'url' => 'http://127.0.0.1:13714',
    ],
    ```
  - Start the Inertia SSR server (handled by PM2 above).

#### **8. Test the Deployment**
- **Visit Your Domain**: Open `https://your-domain.com` in a browser to verify the Laravel application loads.
- **Check SSR**: View the page source to confirm fully rendered HTML (not just a `<div id="app">` with JavaScript).
- **Troubleshoot Errors**:
  - Check Laravel logs: `storage/logs/laravel.log`
  - Check Apache/Nginx logs: `/var/log/apache2/laravel-error.log` or `/var/log/nginx/error.log`
  - Check PM2 logs for SSR: `pm2 logs inertia-ssr`
  - Use Hostinger’s Kodee AI tool in hPanel to diagnose issues (e.g., “PHP artisan migrate error”).

#### **9. Optimize for Production**
- **Optimize Laravel**:
  - Cache configuration, routes, and views:
    ```bash
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```
- **Secure the Application**:
  - Set `APP_DEBUG=false` in `.env`.
  - Use HTTPS by installing an SSL certificate via Hostinger’s hPanel.
- **Set Up Cron Jobs** (if needed):
  - Add a cron job for Laravel’s scheduler:
    ```bash
    crontab -e
    ```
    Add:
    ```bash
    * * * * * /usr/bin/php /var/www/laravel/artisan schedule:run >> /dev/null 2>&1
    ```

---

### **Notes and Considerations**
- **Shared Hosting Limitations**: Hostinger’s shared hosting plans often lack Node.js support, making SSR difficult. A VPS is recommended for full control.
- **Performance**: SSR requires a Node.js process, which increases server resource usage. Choose a VPS plan with at least 2 CPUs and 4GB RAM for smooth performance.
- **Alternative Hosting**: If Hostinger’s VPS setup is complex, consider platforms like Laravel Forge ($12.99/month) or Fly.io, which simplify SSR deployment.[](https://www.hostinger.com/tutorials/how-to-deploy-laravel)[](https://fly.io/laravel-bytes/inertia-ssr-laravel-fly/)
- **SEO Benefits**: SSR ensures search engines receive fully rendered HTML, improving SEO. Verify this using tools like Google’s URL Inspection Tool.
- **Documentation**: Refer to Inertia.js SSR documentation and Laravel 12 deployment guides for additional details.[](https://laravel-news.com/inertia-server-side-rendering)[](https://laravel.com/docs/12.x/frontend)

---

### **Sources**
- Hostinger Laravel VPS Deployment Guide[](https://www.hostinger.com/tutorials/how-to-deploy-laravel)
- Inertia.js SSR Setup[](https://laravel-news.com/inertia-server-side-rendering)[](https://medium.com/%40arifulhaque313/how-to-deploy-laravel-vue-inertia-app-with-inertia-ssr-on-the-server-86ed76ac9471)
- Laravel with Inertia and React Setup[](https://medium.com/%40demian.kostelny/set-up-laravel-app-with-inertia-js-react-js-and-vite-js-60f1f5fb8b73)[](https://dev.to/thefeqy/a-practical-guide-to-using-reactjs-with-inertiajs-2-and-laravel-11-4adc)
- Fly.io Laravel Inertia SSR Deployment[](https://fly.io/laravel-bytes/inertia-ssr-laravel-fly/)

If you encounter specific errors or need further clarification, let me know, and I can guide you through troubleshooting!