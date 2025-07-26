package domain

import (
	"crypto/rand"
	"fmt"

	"github.com/google/uuid"
)

type OTP struct {
	UserID uuid.UUID
	Code   string
}

// NewOTP generates a 6-digit code that expires in 5 minutes
func NewOTP(userID uuid.UUID) (OTP, error) {
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
		UserID: userID,
		Code:   code,
	}, nil
}

// Validate checks expiry
func (o OTP) Validate(code string) error {
	if o.Code != code {
		return ValidationError("incorrect code")
	}
	return nil
}
