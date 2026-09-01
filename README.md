# E-commerce Scraper

A full-stack product scraping app with:
- Laravel backend for scraping, storing, and exposing product data
- Next.js frontend for the product grid and Jumia scrape form
- Go microservice for optional proxy rotation
- Docker and Makefile helpers for easier local setup

## What this project does

- Lets a user paste a Jumia product URL and scrape it
- Stores the scraped product in the Laravel database
- Lists saved products in the frontend
- Shows the product feed in a polished ecommerce-style grid
- Supports a reusable selector-based scraper for different sites

## Project structure

- `backend/` — Laravel API and scraping logic
- `frontend/` — Next.js app with the UI
- `proxyService/` — Go proxy manager
- `Makefile` — quick local commands
- `docker-compose.yml` — local multi-container setup

## Stack

- Backend: Laravel 13 + PHP 8.3
- Frontend: Next.js + React + TypeScript + TanStack Query
- Proxy: Go standard library HTTP service
- Database: MySQL (or SQLite for quick local testing if adjusted)

## Features

- Jumia URL input form on the home page
- Scrape now action with React Query mutation
- List scrapes button that navigates to the products page
- Product cards with title, price, image, and source link
- Query-based product loading using the same shared fetch flow as the products page
- Optional proxy manager integration via Laravel config
- Docker support for running the app as a stack

## Local setup


#### 1) Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

API base URL:

```bash
http://127.0.0.1:8000/api
```

#### 2) Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.development
pnpm dev
```

Env:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Frontend URL:

```bash
http://localhost:3000
```

#### 3) Proxy service

```bash
cd proxyService
go run .
```

The proxy service runs on:

```bash
http://localhost:9090
```

Proxying is optional. If you are not using real proxies, keep it disabled in Laravel config.

## Laravel proxy config

In [backend/config/services.php](backend/config/services.php), the proxy manager is controlled by:

```php
'proxy_manager' => [
    'enabled' => env('PROXY_MANAGER_ENABLED', false),
    'url' => env('PROXY_MANAGER_URL', 'http://localhost:9090'),
],
```

This is off by default for local testing.

## Main API routes

- `GET /api/products`
- `POST /api/products/scrape`

## Docker

You can run the full stack with Docker Compose:

```bash
docker compose up --build
```

This starts:
- Laravel backend on `http://localhost:8000`
- Next.js frontend on `http://localhost:3000`
- Go proxy service on `http://localhost:9090`
- MySQL database on `localhost:3306`

## Notes

- The scraper is selector-based and designed to work with different storefronts by passing XPath selectors.
- Jumia and similar sites can block scrapers or change markup often, so selectors may need updates.
- For local testing, use a legal or controlled target page instead of a site that actively blocks automation.
- The app is built as a demo/prototype architecture, not a production scraping system.

## Quick run order

```bash
cd backend && php artisan serve
cd proxyService && go run .
cd frontend && pnpm dev
```

Or:

```bash
make dev
```
