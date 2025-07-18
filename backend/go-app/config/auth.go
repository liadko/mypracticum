package config

import "time"

// AuthConfig holds DB URL, JWT secret/issuer/TTL, etc.
type AuthConfig struct {
	DatabaseURL string        `mapstructure:"databaseURL"`
	JWTSecret   string        `mapstructure:"jwtSecret"`
	JWTIssuer   string        `mapstructure:"jwtIssuer"`
	JWTTTL      time.Duration `mapstructure:"jwtTTL"`
}
