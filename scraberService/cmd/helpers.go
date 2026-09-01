package main

import (
	"encoding/json"
	"net/http"
)

// envelope wraps ad-hoc JSON response bodies so call sites read a bit
// more clearly than a bare map[string]interface{} literal.
type envelope map[string]interface{}

func (app *application) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		app.logger.Printf("error writing JSON response: %v", err)
	}
}

func (app *application) writeError(w http.ResponseWriter, status int, message string) {
	app.writeJSON(w, status, envelope{"error": message})
}

func (app *application) methodNotAllowed(w http.ResponseWriter) {
	app.writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}
