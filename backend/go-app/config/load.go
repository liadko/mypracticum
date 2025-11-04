package config

import (
	"log"

	"github.com/spf13/viper"
)

// Load reads config/app.yaml, then overrides from env and .env file.
func Load() AppConfig {
	viper.SetConfigName("app")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("config") // or wherever you put it

	viper.AutomaticEnv()   // read ENV vars
	viper.SetEnvPrefix("") // no prefix → use uppercase keys
	// bind secrets
	viper.BindEnv("port", "PORT")
	viper.BindEnv("auth.databaseURL", "DATABASE_URL")
	viper.BindEnv("auth.jwtSecret", "JWT_SECRET")
	// optional SMTP bindings
	viper.BindEnv("smtp.host", "SMTP_HOST")
	viper.BindEnv("smtp.port", "SMTP_PORT")
	viper.BindEnv("smtp.username", "SMTP_USER")
	viper.BindEnv("smtp.password", "SMTP_PASS")
	viper.BindEnv("smtp.from", "SMTP_FROM")

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("config load error: %v", err)
	}

	// crash if any of these aren’t set
	required := []string{
		"auth.databaseURL",
		"auth.jwtSecret",
	}
	for _, key := range required {
		if !viper.IsSet(key) || viper.GetString(key) == "" {
			log.Fatalf("missing required config key %q", key)
		}
	}

	var cfg AppConfig
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatalf("config decode error: %v", err)
	}
	return cfg
}
