package config

import "log"

// AppConfig aggregates all sub-configs.
type AppConfig struct {
	Port string     `mapstructure:"port"`
	Auth AuthConfig `mapstructure:"auth"`
	SMTP SMTPConfig `mapstructure:"smtp"`
	OTP  OTPConfig  `mapstructure:"otp"`
}

// Validate fails fast if any required config value is missing or invalid.
func (c AppConfig) Validate() {
	var missing []string

	// string fields
	if c.Port == "" {
		missing = append(missing, "port")
	}
	if c.Auth.DatabaseURL == "" {
		missing = append(missing, "auth.databaseURL")
	}
	if c.Auth.JWTSecret == "" {
		missing = append(missing, "auth.jwtSecret")
	}
	if c.Auth.JWTIssuer == "" {
		missing = append(missing, "auth.jwtIssuer")
	}

	// smtp fields (ensure all required smtp configs are present)
	if c.SMTP.Host == "" {
		missing = append(missing, "smtp.host")
	}
	if c.SMTP.Port == 0 {
		missing = append(missing, "smtp.port")
	}
	if c.SMTP.Username == "" {
		missing = append(missing, "smtp.username")
	}
	if c.SMTP.Password == "" {
		missing = append(missing, "smtp.password")
	}
	if c.SMTP.From == "" {
		missing = append(missing, "smtp.from")
	}

	// numeric/time fields
	if c.Auth.JWTTTL <= 0 {
		missing = append(missing, "auth.jwtTTL")
	}
	if c.OTP.CodeLength <= 0 {
		missing = append(missing, "otp.codeLength")
	}
	if c.OTP.Expiry <= 0 {
		missing = append(missing, "otp.expiry")
	}
	if c.OTP.SendWindow <= 0 {
		missing = append(missing, "otp.sendWindow")
	}
	if c.OTP.GlobalOTPWindow <= 0 {
		missing = append(missing, "otp.globalOTPWindow")
	}

	if len(missing) > 0 {
		log.Fatalf("missing or invalid config keys: %v", missing)
	}
}
