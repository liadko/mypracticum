package repository

import "context"

// UserRepository knows how to look up users by their student ID.
type UserRepository interface {
	// GetByStudentID returns the UUID for the given government student ID.
	GetByStudentID(ctx context.Context, studentID string) (string, error)
}
