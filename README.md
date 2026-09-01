# E-commerce Scraper

A small full-stack scraper with:
- Laravel API for scraping and storing products
- Next.js frontend for the UI
- Go proxy service for optional proxy rotation

## Stack
- Backend: `backend`
- Frontend: `frontend`
- Proxy: `proxyService`

## Local setup

### 1) Database Setup
Before running the backend, create a MySQL database manually (e.g., via MySQL CLI, phpMyAdmin, or TablePlus):
```sql
CREATE DATABASE scraper_db;
```

### 2) Backend
```bash
cd backend
composer install
cp .env.example .env  # if available
php artisan key:generate
php artisan migrate
php artisan serve
```

API runs at: `http://127.0.0.1:8000/api`
Enable go Proxy service by 
```bash
cd backend
cd config
```
open service.php enable proxy manager its off by default for testing
```code
'proxy_manager' => [
        'enabled' => env('PROXY_MANAGER_ENABLED', false),
        'url' => env('PROXY_MANAGER_URL', 'http://localhost:9090'),
    ],
```
### 3) Frontend
```bash
cd frontend
pnpm install
```

Create or update `.env.development`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Then run:
```bash
pnpm dev
```

Frontend runs at: `http://localhost:3000`

### 4) Proxy service
```bash
cd proxyService
go run .
```

This is optional for local dev. If you are not using real proxies, keep proxying disabled or configure a valid proxy list in main.go .

## Main routes
- `GET /api/products`
- `POST /api/products/scrape`

## Notes
- The scraper is selector-based, so you can pass different XPath selectors for different stores.
- Jumia and other ecommerce sites may block scraping or require valid selectors and anti-bot handling.
- For local work, use a legal/test page or your own controlled target.

## Common run order
```bash 
cd backend && php artisan serve
cd proxyService && cd cmd && go run .
cd frontend && pnpm dev
```
