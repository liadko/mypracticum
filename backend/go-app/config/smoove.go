package config

// SmooveConfig holds the CRM base URL and API key.
type SmooveConfig struct {
	BaseURL string `mapstructure:"baseURL"`
	APIKey  string `mapstructure:"apiKey"`
}
