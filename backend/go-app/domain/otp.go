package domain

import (
	"crypto/rand"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type OTP struct {
	UserID    uuid.UUID
	Code      string
	ExpiresAt time.Time
}

// NewOTP generates a 6-digit code that expires in 5 minutes
func NewOTP(userID uuid.UUID, codeExpire time.Duration) (OTP, error) {
	const length = 6
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return OTP{}, fmt.Errorf("generate code: %w", err)
	}
	code := ""
	for _, b := range buf {
		code += fmt.Sprint(int(b) % 10)
	}

	return OTP{
		UserID:    userID,
		Code:      code,
		ExpiresAt: time.Now().Add(codeExpire),
	}, nil
}

// Validate checks expiry
func (o OTP) Validate(code string) error {
	if o.Code != code {
		return ValidationError("incorrect code")
	}
	if time.Now().After(o.ExpiresAt) {
		return ValidationError("code expired")
	}
	return nil
}
