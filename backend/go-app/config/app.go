package config

import (
	"log"

	"github.com/spf13/viper"
)

// AppConfig aggregates all sub-configs.
type AppConfig struct {
	Auth   AuthConfig   `mapstructure:"auth"`
	Smoove SmooveConfig `mapstructure:"smoove"`
	OTP    OTPConfig    `mapstructure:"otp"`
}

// Load reads config/app.yaml, then overrides from env and .env file.
func Load() AppConfig {
	viper.SetConfigName("app")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("config") // or wherever you put it

	viper.AutomaticEnv()   // read ENV vars
	viper.SetEnvPrefix("") // no prefix → use uppercase keys
	// bind secrets
	viper.BindEnv("auth.databaseURL", "DATABASE_URL")
	viper.BindEnv("auth.jwtSecret", "JWT_SECRET")
	viper.BindEnv("smoove.apiKey", "SMOOVE_API_KEY")

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("config load error: %v", err)
	}

	var cfg AppConfig
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatalf("config decode error: %v", err)
	}
	return cfg
}
