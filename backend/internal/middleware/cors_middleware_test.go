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

func TestCORSMiddleware_ProductionStrict(t *testing.T) {
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	strictMw := NewCORSMiddlewareWithConfig(CORSConfig{
		AllowedOrigins:      []string{"https://shoes4us.vercel.app"},
		Production:          true,
		AllowVercelPreviews: false,
	})(nextHandler)

	cases := []struct {
		name        string
		origin      string
		expectAllow bool
	}{
		{"explicit production origin allowed", "https://shoes4us.vercel.app", true},
		{"arbitrary vercel subdomain rejected in strict production", "https://attacker.vercel.app", false},
		{"localhost rejected in strict production", "http://localhost:3000", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
			req.Header.Set("Origin", tc.origin)
			rec := httptest.NewRecorder()
			strictMw.ServeHTTP(rec, req)

			got := rec.Header().Get("Access-Control-Allow-Origin")
			if tc.expectAllow && got != tc.origin {
				t.Fatalf("expected origin %s allowed, got %q", tc.origin, got)
			}
			if !tc.expectAllow && got != "" {
				t.Fatalf("expected origin %s blocked, got %q", tc.origin, got)
			}
		})
	}

	previewEnabledMw := NewCORSMiddlewareWithConfig(CORSConfig{
		AllowedOrigins:      []string{"https://shoes4us.com"},
		Production:          true,
		AllowVercelPreviews: true,
	})(nextHandler)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	req.Header.Set("Origin", "https://preview-branch.vercel.app")
	rec := httptest.NewRecorder()
	previewEnabledMw.ServeHTTP(rec, req)
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://preview-branch.vercel.app" {
		t.Fatalf("expected vercel preview origin allowed when opt-in enabled, got %q", got)
	}
}

