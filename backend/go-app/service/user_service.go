package service

import (
	"context"
	"errors"
	"fmt"

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

// UpdateSignature stores the raw image bytes (PNG, JPEG...) of the user’s signature.
//
// Returns:
//
//	– the saved []byte
//
// Errors:
//
//	– NotFoundError   if no user exists for the given ID.
//	– any other error wraps a repository or internal failure.
func (s *UserService) UpdateSignature(
	ctx context.Context,
	userID uuid.UUID,
	png []byte,
) ([]byte, error) {

	saved, err := s.userRepo.UpdateSignature(ctx, userID, png)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, NotFoundError{"signature of user", userID.String()}
		}
		return nil, DBError{fmt.Errorf("update signature: %w", err)}
	}

	// Return exactly what we stored
	return saved, nil
}

// CreateUserWithRole builds & validates a new user (incl. role) in the domain,
// then persists it via the repo. Domain handles all field validation.
func (s *UserService) CreateUserWithRole(
	ctx context.Context,
	newUser domain.NewUserWithRole, // e.g. {Email, FirstName, LastName, Role, CreatedBy}
) (domain.User, error) {

	// 1) build & validate in one shot (you'll implement this in domain)
	u, err := domain.NewUserFromWithRole(newUser)
	if err != nil {
		return domain.User{}, err
	}

	// 2) persist
	created, err := s.userRepo.CreateUser(ctx, u)
	if err != nil {
		// optional light mapping; drop if you want it as minimal as AddEntry
		if errors.Is(err, repository.ErrDuplicate) {
			return domain.User{}, AlreadyExistsError{Resource: "user", Field: "email", Value: u.Email}
		}
		if errors.Is(err, repository.ErrNotFound) { // role not found
			return domain.User{}, NotFoundError{"role", string(u.Roles[0])}
		}
		return domain.User{}, DBError{Err: err}
	}

	return created, nil
}

func (s *UserService) GetRolesByID(ctx context.Context, userID uuid.UUID) ([]string, error) {
	roles, err := s.userRepo.FetchRoles(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, NotFoundError{"roles for user", userID.String()}
		}
		return nil, DBError{Err: err}
	}

	return roles, nil
}
