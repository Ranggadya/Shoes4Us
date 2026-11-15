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

const defaultMaxBuckets = 10_000

var defaultTrustedProxyCIDRs = []string{
	"127.0.0.0/8",
	"::1/128",
	"10.0.0.0/8",
	"172.16.0.0/12",
	"192.168.0.0/16",
	"100.64.0.0/10",
}

type ipBucket struct {
	count   int
	resetAt time.Time
}

// RateLimiter provides thread-safe per-IP request rate limiting with bounded bucket storage.
type RateLimiter struct {
	mu           sync.Mutex
	buckets      map[string]*ipBucket
	limit        int
	window       time.Duration
	lastGC       time.Time
	maxBuckets   int
	trustedNets  []*net.IPNet
}

// NewRateLimiter constructs a middleware allowing up to `limit` requests per `window` per client IP.
// Forwarded headers are only trusted when the direct socket peer belongs to private/loopback proxy CIDRs.
func NewRateLimiter(limit int, window time.Duration) func(http.Handler) http.Handler {
	return NewRateLimiterWithTrustedProxies(limit, window, nil)
}

// NewRateLimiterWithTrustedProxies constructs a RateLimiter with explicit trusted proxy CIDRs or IPs.
// Pass []string{"none"} to disable trusting X-Forwarded-For / X-Real-IP completely.
func NewRateLimiterWithTrustedProxies(limit int, window time.Duration, trustedProxies []string) func(http.Handler) http.Handler {
	if limit <= 0 {
		limit = 60
	}
	if window <= 0 {
		window = time.Minute
	}

	rl := &RateLimiter{
		buckets:     make(map[string]*ipBucket),
		limit:       limit,
		window:      window,
		lastGC:      time.Now(),
		maxBuckets:  defaultMaxBuckets,
		trustedNets: parseTrustedProxyNets(trustedProxies),
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

		ip := extractClientIP(r, rl.trustedNets)
		now := time.Now()

		rl.mu.Lock()
		if now.Sub(rl.lastGC) > rl.window*2 {
			rl.purgeExpiredLocked(now)
			rl.lastGC = now
		}

		bucket, exists := rl.buckets[ip]
		if !exists || now.After(bucket.resetAt) {
			if !exists && rl.maxBuckets > 0 && len(rl.buckets) >= rl.maxBuckets {
				rl.evictIfFullLocked(now)
			}
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

func (rl *RateLimiter) purgeExpiredLocked(now time.Time) {
	for k, b := range rl.buckets {
		if now.After(b.resetAt) {
			delete(rl.buckets, k)
		}
	}
}

func (rl *RateLimiter) evictIfFullLocked(now time.Time) {
	rl.purgeExpiredLocked(now)
	if len(rl.buckets) < rl.maxBuckets {
		return
	}
	var oldestKey string
	var earliestReset time.Time
	first := true
	for k, b := range rl.buckets {
		if first || b.resetAt.Before(earliestReset) {
			oldestKey = k
			earliestReset = b.resetAt
			first = false
		}
	}
	if !first {
		delete(rl.buckets, oldestKey)
	}
}

func parseTrustedProxyNets(raw []string) []*net.IPNet {
	if len(raw) == 0 {
		raw = defaultTrustedProxyCIDRs
	} else if len(raw) == 1 && strings.EqualFold(strings.TrimSpace(raw[0]), "none") {
		return nil
	}

	nets := make([]*net.IPNet, 0, len(raw))
	for _, entry := range raw {
		trimmed := strings.TrimSpace(entry)
		if trimmed == "" || strings.EqualFold(trimmed, "none") {
			continue
		}
		if _, cidr, err := net.ParseCIDR(trimmed); err == nil {
			nets = append(nets, cidr)
			continue
		}
		if ip := net.ParseIP(trimmed); ip != nil {
			bits := 128
			if v4 := ip.To4(); v4 != nil {
				ip = v4
				bits = 32
			}
			nets = append(nets, &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)})
		}
	}
	return nets
}

func isTrustedProxyIP(ip net.IP, trustedNets []*net.IPNet) bool {
	if ip == nil || len(trustedNets) == 0 {
		return false
	}
	for _, n := range trustedNets {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

func extractPeerIP(remoteAddr string) (string, net.IP) {
	raw := strings.TrimSpace(remoteAddr)
	if raw == "" {
		return "", nil
	}
	host, _, err := net.SplitHostPort(raw)
	if err == nil && host != "" {
		raw = host
	}
	raw = strings.Trim(raw, "[]")
	parsed := net.ParseIP(raw)
	return raw, parsed
}

func extractClientIP(r *http.Request, trustedNets []*net.IPNet) string {
	peerStr, peerIP := extractPeerIP(r.RemoteAddr)
	if !isTrustedProxyIP(peerIP, trustedNets) {
		if peerStr != "" {
			return peerStr
		}
		return "unknown"
	}

	// Walk X-Forwarded-For right-to-left so client-supplied leftmost hops cannot bypass rate limits.
	if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		for i := len(parts) - 1; i >= 0; i-- {
			candidate := strings.TrimSpace(parts[i])
			ip := net.ParseIP(candidate)
			if ip == nil {
				continue
			}
			if !isTrustedProxyIP(ip, trustedNets) {
				return ip.String()
			}
		}
	}

	if xrip := strings.TrimSpace(r.Header.Get("X-Real-IP")); xrip != "" {
		if ip := net.ParseIP(xrip); ip != nil && !isTrustedProxyIP(ip, trustedNets) {
			return ip.String()
		}
	}

	if peerStr != "" {
		return peerStr
	}
	return "unknown"
}
