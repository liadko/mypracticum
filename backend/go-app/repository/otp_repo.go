package repository

import (
	"context"
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// OTPRepo defines persistence operations for domain.OTP.
// Implementations can use Postgres, Redis, etc.
type OTPRepo interface {
	// Save stores a new OTP record.
	Save(ctx context.Context, o domain.OTP) error

	// Get fetches an OTP by userID and code.
	Get(ctx context.Context, userID uuid.UUID, code string) (domain.OTP, error)

	// Delete removes a consumed or expired OTP.
	Delete(ctx context.Context, userID uuid.UUID, code string) error
}
