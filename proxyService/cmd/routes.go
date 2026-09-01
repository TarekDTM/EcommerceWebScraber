package main

import "net/http"

// routes wires up the URL patterns to handler methods on *application.
// Kept separate from main() so the route table is easy to scan at a
// glance, and easy to extend (e.g. swap in a router package) later
// without touching startup logic.
func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", app.healthHandler)
	mux.HandleFunc("/proxy", app.nextProxyHandler)
	mux.HandleFunc("/proxies", app.listProxiesHandler)
	mux.HandleFunc("/proxies/report", app.reportProxyHandler)

	return app.enableCORS(mux)
}

// enableCORS adds permissive-but-trusted-origin CORS headers so the
// Next.js frontend (or Laravel, during local dev) can call this service
// directly from the browser if needed. Laravel's server-to-server calls
// don't need this, but it's cheap to have and avoids surprises later.
func (app *application) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		for _, trusted := range app.config.cors.trustedOrigins {
			if origin == trusted {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
