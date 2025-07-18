package config

import "time"

// OTPConfig holds OTP generation & expiry settings.
type OTPConfig struct {
	CodeLength int           `mapstructure:"codeLength"` // digits per code
	Expiry     time.Duration `mapstructure:"expiry"`     // cache TTL
	RateWindow time.Duration `mapstructure:"rateWindow"` // limiter window
}
