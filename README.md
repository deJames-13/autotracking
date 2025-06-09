# AutoTracking System - Local Development Setup

This guide will help you run the AutoTracking system (Laravel 12 + Inertia.js + React + SSR) on your local machine from a clean laptop.

---

## Prerequisites

- **Git**
- **PHP 8.2+**
- **Composer**
- **Node.js (LTS) & npm**
- **SQLite or MySQL** (or compatible database)

---

## 1. Clone the Repository

```bash
git clone https://github.com/deJames-13/autotracking/ AutoTracking
cd AutoTracking
```

---

## 2. Install PHP Dependencies

```bash
composer install
```

---

## 3. Install Node.js Dependencies

```bash
npm install
```

---

## 4. Configure Environment

- Copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Edit `.env` and set your database credentials and `APP_URL` (e.g. `http://localhost:8000`).
- Generate the application key:
  ```bash
  php artisan key:generate
  ```

---

## 5. Set Up the Database

- Create a database (e.g. `autotracking`).
- Update `.env` with your DB settings.
- Run migrations and seeders:
  ```bash
  php artisan migrate --seed
  ```

---

## 6. Build Frontend Assets

```bash
npm run build
```

---

## 7. (Optional) Enable Inertia SSR (Server-Side Rendering)

- Install SSR dependencies (if not already):
  ```bash
  npm install @inertiajs/server @inertiajs/react
  ```
- Build SSR bundle:
  ```bash
  npm run build:ssr
  ```
- Start SSR server (in a new terminal):
  ```bash
  npx pm2 start artisan --name inertia-ssr --interpreter php -- inertia:start-ssr
  ```

---

## 8. Run the Application

- Start Laravel backend:
  ```bash
  php artisan serve
  ```
- (If using SSR) Ensure SSR server is running as above.
- Visit [http://localhost:8000](http://localhost:8000) in your browser.

---

## 9. Useful Commands

- Update dependencies and rebuild:
  ```bash
  ./update.sh
  ```
- Run tests:
  ```bash
  php artisan test
  # or
  ./vendor/bin/pest
  ```

---

## 10. Default Test Users

See `todo.md` for sample credentials (e.g. admin: 100001, technician: 200001, employee: 300001).

---

## 11. Troubleshooting

- If you encounter issues, check:
  - `storage/logs/laravel.log`
  - Database connection in `.env`
  - Permissions for `storage` and `bootstrap/cache`
  - Node.js and Composer versions

---

## 12. Documentation

- See `docs/development/` for implementation and testing guides.
- For deployment, see `DEPLOYMENT.md`.

---

**Happy coding!**
