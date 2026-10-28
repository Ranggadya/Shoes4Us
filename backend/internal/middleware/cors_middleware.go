package middleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

// NewCORSMiddleware returns a Chi-compatible CORS middleware configured for the Shoes4Us frontend.
func NewCORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	origins := allowedOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:3000", "http://localhost:5173"}
	}

	return cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
