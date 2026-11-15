package config_test

import (
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/config"
)

func TestConfig_ValidateRuntimeSecurity(t *testing.T) {
	t.Run("rejects default placeholder secret in production environment", func(t *testing.T) {
		cfg := &config.Config{
			Environment: "production",
			JWTSecret:   "shoes4us-dev-secret-change-in-prod",
			FrontendURL: "https://shoes4us.vercel.app",
		}
		if err := cfg.ValidateRuntimeSecurity(); err == nil {
			t.Fatal("expected error for placeholder JWT_SECRET in production, got nil")
		}
	})

	t.Run("rejects short secret in production environment", func(t *testing.T) {
		cfg := &config.Config{
			Environment: "production",
			JWTSecret:   "too-short-secret",
			FrontendURL: "https://shoes4us.vercel.app",
		}
		if err := cfg.ValidateRuntimeSecurity(); err == nil {
			t.Fatal("expected error for <32-byte JWT_SECRET in production, got nil")
		}
	})

	t.Run("rejects weak secret when non-local HTTPS origin is configured even without ENVIRONMENT=production", func(t *testing.T) {
		cfg := &config.Config{
			Environment:    "development",
			JWTSecret:      "shoes4us-dev-secret-change-in-prod",
			AllowedOrigins: []string{"https://shoes4us.vercel.app"},
		}
		if err := cfg.ValidateRuntimeSecurity(); err == nil {
			t.Fatal("expected error for placeholder secret with remote HTTPS origin, got nil")
		}
	})

	t.Run("accepts strong 32+ byte secret in production", func(t *testing.T) {
		cfg := &config.Config{
			Environment: "production",
			JWTSecret:   "super-strong-random-production-secret-32chars!",
			FrontendURL: "https://shoes4us.vercel.app",
		}
		if err := cfg.ValidateRuntimeSecurity(); err != nil {
			t.Fatalf("expected nil error for valid production secret, got: %v", err)
		}
	})

	t.Run("allows local development fallback with warning only", func(t *testing.T) {
		cfg := &config.Config{
			Environment:    "development",
			JWTSecret:      "shoes4us-dev-secret-change-in-prod",
			FrontendURL:    "http://localhost:3000",
			AllowedOrigins: []string{"http://localhost:3000"},
		}
		if err := cfg.ValidateRuntimeSecurity(); err != nil {
			t.Fatalf("expected nil in local dev, got: %v", err)
		}
	})
}
