# Product Scraper — Laravel + Next.js + Go

A small web scraping service: a Laravel API scrapes and stores product data
in MySQL, a Go microservice manages proxy rotation, and a Next.js page
displays the results in a live-refreshing grid.

## Architecture

```
┌─────────────┐      GET /products (30s poll)      ┌──────────────────┐
│  Next.js    │ ─────────────────────────────────► │  Laravel API      │
│  /products  │ ◄───────────────────────────────── │  /api/products    │
└─────────────┘              JSON                  │  (MySQL storage)  │
                                                     └────────┬─────────┘
                                                              │ GET /proxy
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Go proxy-service │
                                                     │  (round-robin)    │
                                                     └──────────────────┘
```

- **Laravel** owns the data model, the scrape workflow, and the public API.
  `ScraperService` fetches a page with Guzzle, rotates a pool of user-agent
  strings on every request, optionally pulls a proxy address from the Go
  microservice, parses the HTML with PHP's built-in `DOMDocument`/`DOMXPath`,
  and persists the result via the `Product` model.
- **Go microservice** is a small stateless HTTP service that hands out the
  next proxy in round-robin order and lets the caller report a proxy as
  unhealthy so it's skipped until reported healthy again. It's intentionally
  dependency-free (standard library only) for fast builds and a small
  attack surface.
- **Next.js** fetches `/api/products` on mount and every 30 seconds via
  `setInterval`, rendering a responsive card grid with title, price, and
  image, plus a skeleton loading state and error banner.

## A note on scraping targets

The task references Amazon/Jumia as examples, but most large e-commerce
sites explicitly disallow automated scraping in their Terms of Service and
`robots.txt`, and Amazon in particular actively blocks scrapers. For
development and demoing this project, point the scraper at a site built
for scraping practice, e.g. `https://books.toscrape.com`, or a page you
control. The `ScraperService::scrapeProduct()` method accepts XPath
selectors as a parameter specifically so it isn't hard-coded to one site's
markup — swap selectors to target whichever page you're legally permitted
to scrape.

## Setup

### Quick start with the Makefile

A `Makefile` at the repo root wires up config across all three services and
can launch them together:

```bash
make setup   # first time only: creates .env files, installs deps, migrates DB
make dev     # runs backend + proxy + frontend together (Ctrl+C stops all)
```

`make setup` requires a MySQL database already created and reachable per
`backend-laravel/.env` before `make migrate` will succeed. `make dev` starts
all three processes in the background and wires their env vars to point at
each other automatically (e.g. `PROXY_MANAGER_URL` → the Go service,
`NEXT_PUBLIC_API_URL` → the Laravel API). Override ports or the proxy list
inline: `make dev PROXY_PORT=9091 PROXY_LIST=http://p1:8080,http://p2:8080`.

Run `make help` to see every available target, or run one service at a time
with `make backend`, `make proxy`, or `make frontend`.

The sections below describe the same steps manually, for reference.

### 1. Laravel backend

```bash
cd backend-laravel
composer create-project laravel/laravel . --prefer-dist   # if starting fresh; otherwise composer install
composer require guzzlehttp/guzzle
cp .env.example .env
php artisan key:generate
```

Merge the contents of `config/services.proxy_manager.snippet.php` into your
`config/services.php` (inside the returned array), then set up the database:

```bash
# create a `scraper` MySQL database matching .env, then:
php artisan migrate
php artisan serve   # http://localhost:8000
```

Trigger a scrape:

```bash
curl -X POST http://localhost:8000/api/products/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
    "selectors": {
      "title": "//h1",
      "price": "//p[contains(@class,\"price_color\")]",
      "image": "//div[contains(@class,\"item active\")]//img"
    }
  }'
```

Fetch stored products:

```bash
curl http://localhost:8000/api/products
```

### 2. Go proxy microservice

```bash
cd proxy-service-go
go run ./cmd/api   # http://localhost:9090
```

Structure: `internal/data/proxies.go` holds the `ProxyModel` (round-robin
logic), `cmd/api/` holds the HTTP layer (`main.go` for config/startup,
`routes.go`, `handlers.go`, `helpers.go`). Config comes from env vars —
`PORT`, `ENV`, `PROXY_LIST` (comma-separated), `CORS_TRUSTED_ORIGINS`.

To build a binary instead of using `go run`:

```bash
go build -o bin/proxy-service ./cmd/api
./bin/proxy-service
```

Set `PROXY_LIST` to a comma-separated list of real proxy addresses, and set
`PROXY_MANAGER_ENABLED=true` / `PROXY_MANAGER_URL=http://localhost:9090` in
the Laravel `.env` to have the scraper pull a proxy for each request.

### 3. Next.js frontend

```bash
cd frontend-nextjs
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your Laravel API
npm run dev   # http://localhost:3000/products
```

## Key design decisions

- **Selector-driven scraping** rather than a hard-coded Amazon parser: real
  target sites change markup often and block scrapers, so the service takes
  selectors per-request instead of baking in fragile, ToS-risky assumptions.
- **Graceful proxy fallback**: if the Go microservice is down or disabled,
  `ScraperService` logs a warning and scrapes directly rather than failing
  the whole request — proxying is an enhancement, not a hard dependency.
- **Stateless Go service, standard library only**: round-robin proxy
  selection doesn't need a framework or external state store; a mutex-guarded
  in-memory slice is enough and keeps the service trivial to build and run.
- **Client-side polling over WebSockets**: a 30-second refresh requirement
  doesn't justify the complexity of a persistent connection; `setInterval` +
  `fetch` is simpler to reason about and sufficient here.

## Challenges / things to watch

- Scraper robustness: pages change markup, so selectors will periodically
  break — this is the main ongoing maintenance cost of any scraper.
- Rate limiting / blocking: user-agent rotation and proxying reduce but
  don't eliminate the risk of being blocked; add request delays and respect
  `robots.txt` for any real deployment.
- Price parsing: currency symbols and formatting vary by locale/site, so
  `normalizePrice()` strips non-numeric characters — this will need
  extending for multi-currency support.
