package middleware

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

type ipBucket struct {
	count   int
	resetAt time.Time
}

// RateLimiter provides thread-safe per-IP request rate limiting.
type RateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*ipBucket
	limit   int
	window  time.Duration
	lastGC  time.Time
}

// NewRateLimiter constructs a middleware allowing up to `limit` requests per `window` per client IP.
func NewRateLimiter(limit int, window time.Duration) func(http.Handler) http.Handler {
	if limit <= 0 {
		limit = 60
	}
	if window <= 0 {
		window = time.Minute
	}

	rl := &RateLimiter{
		buckets: make(map[string]*ipBucket),
		limit:   limit,
		window:  window,
		lastGC:  time.Now(),
	}

	return rl.Handler
}

// Handler enforces the rate limit on incoming HTTP requests.
func (rl *RateLimiter) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		ip := extractClientIP(r)
		now := time.Now()

		rl.mu.Lock()
		if now.Sub(rl.lastGC) > rl.window*2 {
			for k, b := range rl.buckets {
				if now.After(b.resetAt) {
					delete(rl.buckets, k)
				}
			}
			rl.lastGC = now
		}

		bucket, exists := rl.buckets[ip]
		if !exists || now.After(bucket.resetAt) {
			bucket = &ipBucket{
				count:   0,
				resetAt: now.Add(rl.window),
			}
			rl.buckets[ip] = bucket
		}

		bucket.count++
		currentCount := bucket.count
		remaining := rl.limit - currentCount
		if remaining < 0 {
			remaining = 0
		}
		retryAfterSec := int(time.Until(bucket.resetAt).Seconds()) + 1
		if retryAfterSec < 1 {
			retryAfterSec = 1
		}
		rl.mu.Unlock()

		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(rl.limit))
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if currentCount > rl.limit {
			w.Header().Set("Retry-After", strconv.Itoa(retryAfterSec))
			response.WriteError(w, &domain.AppError{
				Status:  http.StatusTooManyRequests,
				Code:    "RATE_LIMITED",
				Message: "Terlalu banyak permintaan. Silakan coba lagi beberapa saat.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

func extractClientIP(r *http.Request) string {
	if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		if first := strings.TrimSpace(parts[0]); first != "" {
			return first
		}
	}
	if xrip := strings.TrimSpace(r.Header.Get("X-Real-IP")); xrip != "" {
		return xrip
	}
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	if r.RemoteAddr != "" {
		return r.RemoteAddr
	}
	return "unknown"
}
