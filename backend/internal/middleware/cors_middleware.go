package middleware

import (
	"net/http"
	"strings"

	"github.com/go-chi/cors"
)

// NewCORSMiddleware returns a Chi-compatible CORS middleware configured for the Shoes4Us frontend.
func NewCORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	origins := []string{
		"http://localhost:3000",
		"http://localhost:5173",
		"https://*.vercel.app",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5173",
	}

	seen := make(map[string]struct{}, len(origins)+len(allowedOrigins))
	for _, o := range origins {
		seen[o] = struct{}{}
	}

	for _, o := range allowedOrigins {
		trimmed := strings.TrimRight(strings.TrimSpace(o), "/")
		if trimmed != "" {
			if _, exists := seen[trimmed]; !exists {
				origins = append(origins, trimmed)
				seen[trimmed] = struct{}{}
			}
		}
	}

	return cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Origin"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}

