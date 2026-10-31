package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all environment-driven application settings.
type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	JWTExpiresHours int
	FrontendURL     string
	AllowedOrigins  []string
	UploadDir       string
	SMTPHost        string
	SMTPPort        string
	SMTPUser        string
	SMTPPass        string
	SMTPFrom        string
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
	if rawOrigins := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); rawOrigins != "" {
		parts := strings.Split(rawOrigins, ",")
		parsed := make([]string, 0, len(parts))
		for _, p := range parts {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				parsed = append(parsed, trimmed)
			}
		}
		if len(parsed) > 0 {
			origins = parsed
		}
	}

	return &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     strings.TrimSpace(os.Getenv("DATABASE_URL")),
		JWTSecret:       getEnv("JWT_SECRET", "shoes4us-dev-secret-change-in-prod"),
		JWTExpiresHours: expHours,
		FrontendURL:     getEnv("FRONTEND_URL", "http://localhost:3000"),
		AllowedOrigins:  origins,
		UploadDir:       getEnv("UPLOAD_DIR", "./uploads"),
		SMTPHost:        strings.TrimSpace(os.Getenv("MAIL_HOST")),
		SMTPPort:        getEnv("MAIL_PORT", "587"),
		SMTPUser:        strings.TrimSpace(os.Getenv("MAIL_USER")),
		SMTPPass:        strings.TrimSpace(os.Getenv("MAIL_PASS")),
		SMTPFrom:        getEnv("MAIL_FROM", "Shoes4Us <noreply@shoes4us.com>"),
	}, nil
}

func getEnv(key, fallback string) string {
	if val := strings.TrimSpace(os.Getenv(key)); val != "" {
		return val
	}
	return fallback
}
