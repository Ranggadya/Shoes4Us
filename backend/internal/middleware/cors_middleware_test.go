package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSMiddleware(t *testing.T) {
	corsMw := NewCORSMiddleware([]string{"https://shoes4us.com"})

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := corsMw(nextHandler)

	tests := []struct {
		name           string
		origin         string
		method         string
		expectedStatus int
		expectAllow    bool
	}{
		{
			name:           "Vercel domain with hyphen",
			origin:         "https://shoes4-us.vercel.app",
			method:         "OPTIONS",
			expectedStatus: http.StatusOK,
			expectAllow:    true,
		},
		{
			name:           "Localhost 3000",
			origin:         "http://localhost:3000",
			method:         "OPTIONS",
			expectedStatus: http.StatusOK,
			expectAllow:    true,
		},
		{
			name:           "Explicit allowed origin",
			origin:         "https://shoes4us.com",
			method:         "POST",
			expectedStatus: http.StatusOK,
			expectAllow:    true,
		},
		{
			name:           "Random unauthorized origin",
			origin:         "https://evil.com",
			method:         "OPTIONS",
			expectedStatus: http.StatusOK,
			expectAllow:    false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/auth/register", nil)
			req.Header.Set("Origin", tc.origin)
			if tc.method == "OPTIONS" {
				req.Header.Set("Access-Control-Request-Method", "POST")
				req.Header.Set("Access-Control-Request-Headers", "content-type")
			}

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			allowHeader := rec.Header().Get("Access-Control-Allow-Origin")
			if tc.expectAllow {
				if allowHeader != tc.origin {
					t.Errorf("expected Access-Control-Allow-Origin: %s, got: %s", tc.origin, allowHeader)
				}
				credHeader := rec.Header().Get("Access-Control-Allow-Credentials")
				if credHeader != "true" {
					t.Errorf("expected Access-Control-Allow-Credentials: true, got: %s", credHeader)
				}
			} else {
				if allowHeader != "" {
					t.Errorf("expected no Access-Control-Allow-Origin, got: %s", allowHeader)
				}
			}
		})
	}
}
