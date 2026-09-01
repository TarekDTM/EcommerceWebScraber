// Command api is the proxy-management microservice. It hands out proxy
// addresses in round-robin order and lets callers report a proxy as
// healthy/unhealthy.
//
// Endpoints:
//
//	GET  /health         -> liveness check
//	GET  /proxy          -> {"proxy": "http://1.2.3.4:8080"} (next proxy, round-robin)
//	GET  /proxies        -> list all known proxies + status
//	POST /proxies/report -> {"proxy": "...", "healthy": false} mark a proxy up/down
package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"proxyService/internal/data"
)

// config holds everything that can be tuned per-environment. Keeping it as
// one struct (rather than scattered package-level vars) makes it obvious
// what the service depends on, and makes it easy to load from flags/env
// in one place in main().
type config struct {
	port    int
	env     string
	proxies []string
}

// application bundles the config plus anything handlers need to do their
// job (models, logger, ...). Handlers become methods on *application so
// they can reach app.models.Proxies etc. instead of relying on
// package-level globals.
type application struct {
	config config
	logger *log.Logger
	models data.Models
}

func main() {
	cfg := loadConfig()

	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	app := &application{
		config: cfg,
		logger: logger,
		models: data.NewModels(cfg.proxies),
	}

	srv := &http.Server{
		Addr:         ":" + strconv.Itoa(app.config.port),
		Handler:      app.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	app.logger.Printf(
		"starting %s server on :%d with %d proxies",
		app.config.env, app.config.port, len(app.config.proxies),
	)
	log.Fatal(srv.ListenAndServe())
}

// loadConfig reads settings from environment variables, falling back to
// sensible defaults so the service runs with zero config for local dev.
func loadConfig() config {
	var cfg config

	cfg.port = envInt("PORT", 9090)
	cfg.env = envString("ENV", "development")
	// add your proxies
	cfg.proxies = []string{
		"http://proxy1.example.com:8080",
		"http://proxy2.example.com:8080",
		"http://proxy3.example.com:8080",
	}
	if list := os.Getenv("PROXY_LIST"); list != "" {
		cfg.proxies = splitAndTrim(list, ",")
	}

	return cfg
}

func envString(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func splitAndTrim(s, sep string) []string {
	parts := strings.Split(s, sep)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
