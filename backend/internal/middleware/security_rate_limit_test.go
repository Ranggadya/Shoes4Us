package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSecurityHeaders(t *testing.T) {
	h := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Fatalf("expected X-Content-Type-Options nosniff, got %q", got)
	}
	if got := rec.Header().Get("X-Frame-Options"); got != "DENY" {
		t.Fatalf("expected X-Frame-Options DENY, got %q", got)
	}
	if got := rec.Header().Get("Referrer-Policy"); got != "strict-origin-when-cross-origin" {
		t.Fatalf("expected Referrer-Policy strict-origin-when-cross-origin, got %q", got)
	}
}

func TestRateLimiter(t *testing.T) {
	limiter := NewRateLimiter(2, time.Minute)
	h := limiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 1; i <= 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
		req.RemoteAddr = "192.0.2.10:1234"
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i, rec.Code)
		}
	}

	// 3rd request from same IP should be rate-limited (429)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
	req.RemoteAddr = "192.0.2.10:1234"
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 Too Many Requests, got %d", rec.Code)
	}
	if got := rec.Header().Get("Retry-After"); got == "" {
		t.Fatalf("expected Retry-After header on 429 response")
	}
}

func TestRateLimiter_SpoofingAndBucketCap(t *testing.T) {
	t.Run("ignores spoofed X-Forwarded-For and X-Real-IP from untrusted peer", func(t *testing.T) {
		limiter := NewRateLimiter(2, time.Minute)
		h := limiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		for i := 1; i <= 2; i++ {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
			req.RemoteAddr = "198.51.100.42:5555"
			req.Header.Set("X-Forwarded-For", fmt.Sprintf("203.0.113.%d", i))
			req.Header.Set("X-Real-IP", fmt.Sprintf("203.0.113.%d", 100+i))
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("request %d: expected 200, got %d", i, rec.Code)
			}
		}

		// 3rd request rotates X-Forwarded-For again, must still hit limit on real peer 198.51.100.42
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
		req.RemoteAddr = "198.51.100.42:5555"
		req.Header.Set("X-Forwarded-For", "192.0.2.99")
		req.Header.Set("X-Real-IP", "192.0.2.100")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429 when rotating spoofed headers from untrusted peer, got %d", rec.Code)
		}
	})

	t.Run("extracts rightmost non-trusted client IP behind proxy even when attacker prepends X-Forwarded-For", func(t *testing.T) {
		limiter := NewRateLimiter(1, time.Minute)
		h := limiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		req1 := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req1.RemoteAddr = "172.18.0.5:4321"
		req1.Header.Set("X-Forwarded-For", "1.1.1.1, 203.0.113.10")
		rec1 := httptest.NewRecorder()
		h.ServeHTTP(rec1, req1)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected first request 200, got %d", rec1.Code)
		}

		// Same client IP appended by proxy (203.0.113.10) with spoofed leftmost IP changed
		req2 := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req2.RemoteAddr = "172.18.0.5:4322"
		req2.Header.Set("X-Forwarded-For", "8.8.8.8, 203.0.113.10")
		rec2 := httptest.NewRecorder()
		h.ServeHTTP(rec2, req2)
		if rec2.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429 when leftmost XFF spoofed behind trusted proxy, got %d", rec2.Code)
		}
	})

	t.Run("trusted proxies none ignores forwarded headers even on localhost", func(t *testing.T) {
		limiter := NewRateLimiterWithTrustedProxies(1, time.Minute, []string{"none"})
		h := limiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		req1 := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req1.RemoteAddr = "127.0.0.1:9000"
		req1.Header.Set("X-Forwarded-For", "203.0.113.1")
		rec1 := httptest.NewRecorder()
		h.ServeHTTP(rec1, req1)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec1.Code)
		}

		req2 := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req2.RemoteAddr = "127.0.0.1:9001"
		req2.Header.Set("X-Forwarded-For", "203.0.113.2")
		rec2 := httptest.NewRecorder()
		h.ServeHTTP(rec2, req2)
		if rec2.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429 when TRUSTED_PROXIES=none, got %d", rec2.Code)
		}
	})

	t.Run("caps buckets map size against memory exhaustion", func(t *testing.T) {
		rl := &RateLimiter{
			buckets:    make(map[string]*ipBucket),
			limit:      5,
			window:     time.Minute,
			lastGC:     time.Now(),
			maxBuckets: 3,
		}
		h := rl.Handler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		for i := 1; i <= 10; i++ {
			req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
			req.RemoteAddr = fmt.Sprintf("198.51.100.%d:1234", i)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", rec.Code)
			}
		}

		if len(rl.buckets) > 3 {
			t.Fatalf("expected buckets capped at <= 3, got %d", len(rl.buckets))
		}
	})
}

