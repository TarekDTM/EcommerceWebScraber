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

	return mux
}
