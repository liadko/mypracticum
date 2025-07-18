package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

// UserService provides user-related business logic.
type UserService struct {
	userRepo repository.UserRepo
}

// NewUserService constructs a UserService.
func NewUserService(userRepo repository.UserRepo) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetUserByEmail looks up a user by their email address.
//
// Returns:
//   - the matching domain.User
//
// Errors:
//   - NotFoundError if no user exists with the given email
//   - DBError        for any underlying database failure
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (domain.User, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.User{}, NotFoundError{"user", email}
		}
		return domain.User{}, DBError{err}
	}
	return user, nil
}

// GetUserByID retrieves a user by their UUID.
//
// Returns:
//   - the matching domain.User
//
// Errors:
//   - NotFoundError if no user exists with the given ID
//   - DBError        for any underlying database failure
func (s *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.User{}, NotFoundError{"user", id.String()}
		}
		return domain.User{}, DBError{Err: err}
	}
	return user, nil
}

// UpdateSignature updates a user’s signature SVG in the database.
//
// Returns:
//
//	– the svg string
//
// Errors:
//
//	– ValidationError if the SVG payload is missing or doesn’t begin with "<svg".
//	– NotFoundError   if no user exists for the given ID.
//	– any other error wraps a repository or internal failure.
func (s *UserService) UpdateSignature(
	ctx context.Context,
	userID uuid.UUID,
	svg string,
) (string, error) {
	svg = strings.TrimSpace(svg)
	if !strings.HasPrefix(svg, "<svg") {
		return "", ValidationError("invalid svg content")
	}

	data := []byte(svg)
	if err := s.userRepo.UpdateSignature(ctx, userID, data); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", NotFoundError{"user", userID.String()}
		}
		return "", fmt.Errorf("update signature: %w", err)
	}

	// Return exactly what we stored
	return svg, nil
}
