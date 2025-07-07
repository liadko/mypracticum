package repository

import (
	"context"
	"mypracticum/backend/domain"
)

// UserRepository knows how to look up users by their student ID.
type UserRepository interface {
	// GetByStudentID returns the UUID for the given government student ID.
	FindByEmail(ctx context.Context, email string) (domain.User, error)
}
