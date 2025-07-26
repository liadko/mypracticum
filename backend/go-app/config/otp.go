package config

import "time"

// OTPConfig holds OTP generation & expiry settings.
type OTPConfig struct {
	CodeLength      int           `mapstructure:"codeLength"`      // digits per code
	Expiry          time.Duration `mapstructure:"expiry"`          // cache TTL
	SendWindow      time.Duration `mapstructure:"sendWindow"`      // limiter window
	GlobalOTPWindow time.Duration `mapstructure:"globalOTPWindow"` // limiter window
}
