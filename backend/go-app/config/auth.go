package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// AuthConfig holds all configuration needed for authentication and JWT.
type AuthConfig struct {
	// Postgres connection URL, e.g. "postgres://user:pass@host:5432/dbname?sslmode=disable"
	DatabaseURL string

	// HMAC secret used to sign JWTs
	JWTSecret string

	// "iss" claim value to embed in tokens
	JWTIssuer string

	// how long tokens live, parsed from a duration string (e.g. "15m", "1h")
	JWTTTL time.Duration
}

// LoadAuthConfig reads auth settings from environment variables and fatal-logs on error.
func LoadAuthConfig() AuthConfig {

	_ = godotenv.Load()

	cfg := AuthConfig{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		JWTIssuer:   os.Getenv("JWT_ISSUER"),
	}

	ttlStr := os.Getenv("JWT_TTL")
	if cfg.DatabaseURL == "" || cfg.JWTSecret == "" || cfg.JWTIssuer == "" || ttlStr == "" {
		log.Fatal("env vars required: DATABASE_URL, JWT_SECRET, JWT_ISSUER, JWT_TTL")
	}

	ttl, err := time.ParseDuration(ttlStr)
	if err != nil {
		log.Fatalf("invalid JWT_TTL: %v", err)
	}
	cfg.JWTTTL = ttl

	return cfg
}
