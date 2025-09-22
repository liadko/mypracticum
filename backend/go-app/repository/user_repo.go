package repository

import (
	"context"
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// UserRepo knows how to look up users by their student ID.
type UserRepo interface {
	FindByEmail(ctx context.Context, email string) (domain.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	FetchRoles(ctx context.Context, userID uuid.UUID) ([]string, error)
	GetIDByEmail(ctx context.Context, email string) (uuid.UUID, error)

	ListStudentsForMentor(ctx context.Context, mentorUserID uuid.UUID) ([]domain.User, error)

	UpdateSignature(ctx context.Context, userID uuid.UUID, sig []byte) ([]byte, error)

	CreateUser(ctx context.Context, u domain.User) (domain.User, error)

	UpdateUserNames(ctx context.Context, userID uuid.UUID, firstName, lastName string) (string, string, error)
}
