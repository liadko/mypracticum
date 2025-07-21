package repository

import (
	"context"
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// UserRepo knows how to look up users by their student ID.
type UserRepo interface {
	// GetByStudentID returns the UUID for the given government student ID.
	FindByEmail(ctx context.Context, email string) (domain.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	UpdateSignature(ctx context.Context, userID uuid.UUID, sig []byte) ([]byte, error)
}
