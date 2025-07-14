package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// AuthConfig holds all configuration needed for authentication and JWT.
type AuthConfig struct {
	DatabaseURL   string        // e.g. "postgres://user:pass@host:5432/db?sslmode=disable"
	JWTSecret     string        // HMAC secret for signing JWTs
	JWTIssuer     string        // "iss" claim for your tokens
	JWTTTL        time.Duration // lifespan of each token
	SmooveBaseURL string        // Smoove CRM API base URL
	SmooveAPIKey  string        // API key or token for Smoove
}

// mustGetEnv reads an env var or fatals immediately if missing.
func mustGetEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("environment variable %q is required", key)
	}
	return val
}

// LoadAuthConfig reads auth settings from environment variables and fatal-logs on error.
func LoadAuthConfig() AuthConfig {

	_ = godotenv.Load()

	// pull each key exactly once
	cfg := AuthConfig{
		DatabaseURL: mustGetEnv("DATABASE_URL"),
		JWTSecret:   mustGetEnv("JWT_SECRET"),
		JWTIssuer:   mustGetEnv("JWT_ISSUER"),

		SmooveBaseURL: mustGetEnv("SMOOVE_BASE_URL"),
		SmooveAPIKey:  mustGetEnv("SMOOVE_API_KEY"),
	}

	// TTL stays special because we need to parse it
	jwtTtlStr := mustGetEnv("JWT_TTL")
	ttl, err := time.ParseDuration(jwtTtlStr)
	if err != nil {
		log.Fatalf("invalid JWT_TTL %q: %v", jwtTtlStr, err)
	}
	cfg.JWTTTL = ttl

	return cfg
}
