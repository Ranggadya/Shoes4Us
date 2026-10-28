package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// RouterDependencies holds configuration and optional domain handlers to mount onto the HTTP router.
type RouterDependencies struct {
	AllowedOrigins []string
	UploadDir      string
	JWTSecret      string
}

// NewRouter constructs the root Chi HTTP router with CORS, static uploads, and /api endpoints.
func NewRouter(deps RouterDependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.NewCORSMiddleware(deps.AllowedOrigins))

	uploadDir := strings.TrimSpace(deps.UploadDir)
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir)))
	r.Get("/uploads/*", func(w http.ResponseWriter, req *http.Request) {
		fileServer.ServeHTTP(w, req)
	})

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			response.WriteSuccess(w, http.StatusOK, "OK", map[string]string{"status": "ok"}, nil)
		})
	})

	return r
}
