# E-commerce Scraper

A full-stack product scraping demo built with Laravel, Next.js, and a small Go proxy manager.

## Overview

This project lets a user paste a product URL, scrape the page, store the result in MySQL, and view saved products in a responsive product grid.

It includes:
- Laravel backend for scraping and API endpoints
- Next.js frontend for product listing and scrape form
- Go microservice for optional proxy rotation
- MySQL database for saved product records

## Project structure

- `backend/` — Laravel API and scraping logic
- `frontend/` — Next.js UI
- `proxyService/` — Go proxy manager

## Tech stack

- Backend: Laravel + PHP
- Frontend: Next.js + React + TypeScript
- Data fetching: TanStack Query
- Database: MySQL
- Proxy service: Go standard library HTTP server

## Features

- Paste a product URL from a storefront such as Jumia
- Scrape product title, price, and image using selector-based logic
- Store scraped records in the database
- List products via a Laravel API
- View product cards in a polished ecommerce-style grid
- Refresh product data on the frontend
- Optional proxy service for rotating requests through a proxy pool

## Prerequisites

Make sure the following are installed:
- PHP
- Composer
- Node.js
- pnpm
- MySQL
- Go

## Backend setup

From the project root:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The Laravel app will run on:

```bash
http://127.0.0.1:8000
```

API base URL:

```bash
http://127.0.0.1:8000/api
```

## Frontend setup

From the project root:

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Example frontend env:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

The frontend will run on:

```bash
http://localhost:3000
```

## Proxy service setup

The Go proxy service is optional and disabled by default for local testing.

From the project root:

```bash
cd proxyService/cmd
go run .
```

The proxy service runs on:

```bash
http://localhost:9090
```

If you want to enable it in Laravel, set:

```env
PROXY_MANAGER_ENABLED=true
PROXY_MANAGER_URL=http://localhost:9090
```

If you want to configure proxy entries in Go, edit the default list in `proxyService/cmd/main.go`.

## Main API routes

- `GET /api/products`
- `POST /api/products/scrape`

## Quick start

Run all services in separate terminals:

```bash
cd backend && php artisan serve
cd proxyService/cmd && go run .
cd frontend && pnpm dev
```

## Notes

- This is a demo/prototype architecture, not a production scraping system.
- Scraping real ecommerce sites can fail due to anti-bot protection or markup changes.
- The scraper is selector-based and should be adjusted for the target site if needed.
- Proxy support is included as an optional layer and is intended to be used with a real proxy pool or proxy manager. The default local setup is disabled and uses direct scraping unless a valid proxy service is configured.

