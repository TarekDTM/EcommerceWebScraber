package main

import (
	"encoding/json"
	"net/http"
)

// healthHandler is a plain liveness check.
func (app *application) healthHandler(w http.ResponseWriter, r *http.Request) {
	app.writeJSON(w, http.StatusOK, envelope{
		"status": "ok",
		"env":    app.config.env,
	})
}

// nextProxyHandler returns the next proxy in round-robin order. This is
// the endpoint Laravel's ScraperService.nextProxy() calls before each
// scrape.
func (app *application) nextProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w)
		return
	}

	proxy, ok := app.models.Proxies.Next()
	if !ok {
		app.writeError(w, http.StatusServiceUnavailable, "no proxies configured")
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"proxy": proxy.Address})
}

// listProxiesHandler returns every known proxy and its health status.
func (app *application) listProxiesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w)
		return
	}

	app.writeJSON(w, http.StatusOK, app.models.Proxies.All())
}

// reportProxyHandler lets a caller (Laravel, after a failed request) mark
// a proxy healthy or unhealthy so it's skipped or resumed in rotation.
func (app *application) reportProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		app.methodNotAllowed(w)
		return
	}

	var body struct {
		Proxy   string `json:"proxy"`
		Healthy bool   `json:"healthy"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		app.writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if ok := app.models.Proxies.Report(body.Proxy, body.Healthy); !ok {
		app.writeError(w, http.StatusNotFound, "proxy not found")
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"status": "updated"})
}
