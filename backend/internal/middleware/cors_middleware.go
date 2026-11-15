package middleware

import (
	"net/http"
	"strings"

	"github.com/go-chi/cors"
)

// CORSConfig configures origin matching policy for browser requests.
type CORSConfig struct {
	AllowedOrigins      []string
	Production          bool
	AllowVercelPreviews bool
}

// NewCORSMiddleware returns a Chi-compatible CORS middleware configured for development/default usage.
func NewCORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	return NewCORSMiddlewareWithConfig(CORSConfig{
		AllowedOrigins: allowedOrigins,
		Production:     false,
	})
}

// NewCORSMiddlewareWithConfig constructs a CORS middleware that enforces explicit origins in production
// and optionally allows localhost dev origins or Vercel previews when enabled.
func NewCORSMiddlewareWithConfig(cfg CORSConfig) func(http.Handler) http.Handler {
	origins := make([]string, 0, len(cfg.AllowedOrigins)+5)
	seen := make(map[string]struct{}, len(cfg.AllowedOrigins)+5)

	appendOrigin := func(raw string) {
		trimmed := strings.TrimRight(strings.TrimSpace(raw), "/")
		if trimmed == "" {
			return
		}
		if _, exists := seen[trimmed]; !exists {
			origins = append(origins, trimmed)
			seen[trimmed] = struct{}{}
		}
	}

	for _, o := range cfg.AllowedOrigins {
		appendOrigin(o)
	}

	if !cfg.Production {
		for _, devOrigin := range []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			"https://*.vercel.app",
		} {
			appendOrigin(devOrigin)
		}
	} else if cfg.AllowVercelPreviews {
		appendOrigin("https://*.vercel.app")
	}

	return cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "Origin"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
