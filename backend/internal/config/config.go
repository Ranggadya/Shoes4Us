package config

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

const (
	defaultDevJWTSecret = "shoes4us-dev-secret-change-in-prod"
	minJWTSecretBytes   = 32
)

var insecureSecretPlaceholders = map[string]struct{}{
	defaultDevJWTSecret: {},
	"changeme_in_production_shoes4us_secret_key_12345": {},
	"secret": {},
}

// Config holds all environment-driven application settings.
type Config struct {
	Environment         string
	Port                string
	DatabaseURL         string
	JWTSecret           string
	JWTExpiresHours     int
	FrontendURL         string
	AllowedOrigins      []string
	HasExplicitCORS     bool
	AllowVercelPreviews bool
	TrustedProxies      []string
	AuthRateLimitPerMin int
	UploadDir           string
	SMTPHost            string
	SMTPPort            string
	SMTPUser            string
	SMTPPass            string
	SMTPFrom            string
	CFR2AccountID       string
	CFR2AccessKeyID     string
	CFR2SecretKey       string
	CFR2BucketName      string
	CFR2PublicURL       string
}

// Load reads environment variables (loading .env if present) and returns Config with defaults.
func Load() (*Config, error) {
	_ = godotenv.Load(".env", "../.env")

	expHours := 168
	if rawExp := strings.TrimSpace(os.Getenv("JWT_EXPIRES_HOURS")); rawExp != "" {
		if parsed, err := strconv.Atoi(rawExp); err == nil && parsed > 0 {
			expHours = parsed
		}
	}

	origins := []string{"http://localhost:3000", "http://localhost:5173"}
	hasExplicitCORS := false
	if rawOrigins := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); rawOrigins != "" {
		parsed := splitCSV(rawOrigins)
		if len(parsed) > 0 {
			origins = parsed
			hasExplicitCORS = true
		}
	}

	envName := strings.ToLower(getEnv("ENVIRONMENT", getEnv("APP_ENV", "development")))
	allowVercelRaw := strings.TrimSpace(os.Getenv("CORS_ALLOW_VERCEL_PREVIEWS"))
	allowVercel := strings.EqualFold(allowVercelRaw, "true") || allowVercelRaw == "1"

	cfg := &Config{
		Environment:         envName,
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         strings.TrimSpace(os.Getenv("DATABASE_URL")),
		JWTSecret:           getEnv("JWT_SECRET", defaultDevJWTSecret),
		JWTExpiresHours:     expHours,
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		AllowedOrigins:      origins,
		HasExplicitCORS:     hasExplicitCORS,
		AllowVercelPreviews: allowVercel,
		TrustedProxies:      splitCSV(os.Getenv("TRUSTED_PROXIES")),
		AuthRateLimitPerMin: 30,
		UploadDir:           getEnv("UPLOAD_DIR", "./uploads"),
		SMTPHost:            strings.TrimSpace(os.Getenv("MAIL_HOST")),
		SMTPPort:            getEnv("MAIL_PORT", "587"),
		SMTPUser:            strings.TrimSpace(os.Getenv("MAIL_USER")),
		SMTPPass:            strings.TrimSpace(os.Getenv("MAIL_PASS")),
		SMTPFrom:            getEnv("MAIL_FROM", "Shoes4Us <noreply@shoes4us.com>"),
		CFR2AccountID:       strings.TrimSpace(os.Getenv("CF_R2_ACCOUNT_ID")),
		CFR2AccessKeyID:     strings.TrimSpace(os.Getenv("CF_R2_ACCESS_KEY_ID")),
		CFR2SecretKey:       strings.TrimSpace(os.Getenv("CF_R2_SECRET_ACCESS_KEY")),
		CFR2BucketName:      strings.TrimSpace(os.Getenv("CF_R2_BUCKET_NAME")),
		CFR2PublicURL:       strings.TrimSpace(os.Getenv("CF_R2_PUBLIC_URL")),
	}

	if !cfg.IsProduction() {
		cfg.AuthRateLimitPerMin = 120
	}
	if rawAuthLimit := strings.TrimSpace(os.Getenv("AUTH_RATE_LIMIT_PER_MIN")); rawAuthLimit != "" {
		if parsed, err := strconv.Atoi(rawAuthLimit); err == nil && parsed > 0 {
			cfg.AuthRateLimitPerMin = parsed
		}
	}

	return cfg, nil
}

// IsProduction reports whether the configuration targets production or non-local HTTPS origins.
func (c *Config) IsProduction() bool {
	if c == nil {
		return false
	}
	if strings.EqualFold(strings.TrimSpace(c.Environment), "production") {
		return true
	}
	if isNonLocalHTTPSURL(c.FrontendURL) {
		return true
	}
	for _, origin := range c.AllowedOrigins {
		if isNonLocalHTTPSURL(origin) {
			return true
		}
	}
	return false
}

// ValidateRuntimeSecurity ensures insecure default or weak secrets are rejected outside local dev.
func (c *Config) ValidateRuntimeSecurity() error {
	if c == nil {
		return errors.New("configuration is nil")
	}

	secret := strings.TrimSpace(c.JWTSecret)
	_, isPlaceholder := insecureSecretPlaceholders[secret]
	tooShort := len([]byte(secret)) < minJWTSecretBytes

	if secret == "" || isPlaceholder || tooShort {
		if c.IsProduction() {
			return errors.New("JWT_SECRET must be set to a unique random secret of at least 32 bytes in production")
		}
		log.Println("WARNING: using insecure/short JWT_SECRET in development mode; set a 32+ byte JWT_SECRET before deploying")
	}
	return nil
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func isNonLocalHTTPSURL(raw string) bool {
	trimmed := strings.ToLower(strings.TrimSpace(raw))
	if !strings.HasPrefix(trimmed, "https://") {
		return false
	}
	return !strings.HasPrefix(trimmed, "https://localhost") &&
		!strings.HasPrefix(trimmed, "https://127.0.0.1")
}

func getEnv(key, fallback string) string {
	if val := strings.TrimSpace(os.Getenv(key)); val != "" {
		return val
	}
	return fallback
}
