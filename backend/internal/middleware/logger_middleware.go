package middleware

import (
	"log/slog"
	"net/http"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"
)

// StructuredLogger logs HTTP requests with correlation request_id, method, path, status, and duration_ms.
func StructuredLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)

		next.ServeHTTP(ww, r)

		status := ww.Status()
		if status == 0 {
			status = http.StatusOK
		}
		durationMs := float64(time.Since(start).Microseconds()) / 1000.0
		reqID := chimw.GetReqID(r.Context())

		attrs := []any{
			slog.String("request_id", reqID),
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", status),
			slog.Float64("duration_ms", durationMs),
			slog.Int("bytes", ww.BytesWritten()),
		}

		if status >= 500 {
			slog.Error("http_request", attrs...)
		} else if status >= 400 {
			slog.Warn("http_request", attrs...)
		} else {
			slog.Info("http_request", attrs...)
		}
	})
}
