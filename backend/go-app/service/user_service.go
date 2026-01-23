package service

import (
	"context"
	"errors"
	"fmt"
	"log"
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
	log.Printf("[UserService.GetUserByEmail] Looking up user by email: %s", email)
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[UserService.GetUserByEmail] User not found: %s", email)
			return domain.User{}, NotFoundError{"user", email}
		}
		log.Printf("[UserService.GetUserByEmail] Failed to find user: %v", err)
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
	log.Printf("[UserService.GetUserByID] Looking up user: %s", id)
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[UserService.GetUserByID] User not found: %s", id)
			return domain.User{}, NotFoundError{"user", id.String()}
		}
		log.Printf("[UserService.GetUserByID] Failed to find user: %v", err)
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
	log.Printf("[UserService.UpdateSignature] Updating signature for user %s, bytes: %d", userID, len(png))

	saved, err := s.userRepo.UpdateSignature(ctx, userID, png)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[UserService.UpdateSignature] User not found: %s", userID)
			return nil, NotFoundError{"signature of user", userID.String()}
		}
		log.Printf("[UserService.UpdateSignature] Failed to update signature: %v", err)
		return nil, DBError{fmt.Errorf("update signature: %w", err)}
	}

	log.Printf("[UserService.UpdateSignature] Signature updated for user %s", userID)
	// Return exactly what we stored
	return saved, nil
}

// CreateUserWithRole builds & validates a new user (incl. role) in the domain,
// then persists it via the repo. Domain handles all field validation.
func (s *UserService) CreateUserWithRole(
	ctx context.Context,
	newUser domain.NewUserWithRole, // e.g. {Email, FirstName, LastName, Role, CreatedBy}
) (domain.User, error) {
	log.Printf("[UserService.CreateUserWithRole] Creating user: email: %s, name: %s %s, role: %s", newUser.Email, newUser.FirstName, newUser.LastName, newUser.Role)

	// 1) domain build & validate in one shot
	u, err := domain.NewUserFromWithRole(newUser)
	if err != nil {
		log.Printf("[UserService.CreateUserWithRole] Validation error: %v", err)
		return domain.User{}, err
	}

	// 2) persist
	created, err := s.userRepo.CreateUser(ctx, u)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			log.Printf("[UserService.CreateUserWithRole] User already exists: %s", u.Email)
			return domain.User{}, AlreadyExistsError{Resource: "user", Field: "email", Value: u.Email}
		}
		if errors.Is(err, repository.ErrNotFound) { // role not found
			log.Printf("[UserService.CreateUserWithRole] Role not found: %s", u.Roles[0])
			return domain.User{}, NotFoundError{"role", string(u.Roles[0])}
		}
		log.Printf("[UserService.CreateUserWithRole] Failed to create user: %v", err)
		return domain.User{}, DBError{Err: err}
	}

	log.Printf("[UserService.CreateUserWithRole] User created: %s", created.ID)
	return created, nil
}

func (s *UserService) GetRolesByID(ctx context.Context, userID uuid.UUID) ([]string, error) {
	log.Printf("[UserService.GetRolesByID] Fetching roles for user: %s", userID)
	roles, err := s.userRepo.FetchRoles(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[UserService.GetRolesByID] User not found: %s", userID)
			return nil, NotFoundError{"roles for user", userID.String()}
		}
		log.Printf("[UserService.GetRolesByID] Failed to fetch roles: %v", err)
		return nil, DBError{Err: err}
	}

	return roles, nil
}

// EnsureUserIDByEmailWithRole returns the user's ID if exists;
// otherwise creates the user with the role and returns its ID.
func (s *UserService) EnsureUserIDByEmailWithRole(
	ctx context.Context,
	email, role, firstName, lastName string,
	createdBy uuid.UUID,
) (uuid.UUID, error) {
	log.Printf("[UserService.EnsureUserIDByEmailWithRole] Ensuring user exists: email: %s, role: %s", email, role)
	id, err := s.userRepo.GetIDByEmail(ctx, email)
	if err == nil {
		log.Printf("[UserService.EnsureUserIDByEmailWithRole] User already exists: %s", id)
		return id, nil
	}
	if !errors.Is(err, repository.ErrNotFound) {
		log.Printf("[UserService.EnsureUserIDByEmailWithRole] Failed to check if user exists: %v", err)
		return uuid.Nil, DBError{Err: err}
	}

	log.Printf("[UserService.EnsureUserIDByEmailWithRole] Creating new user: email: %s, role: %s", email, role)
	created, err := s.CreateUserWithRole(ctx, domain.NewUserWithRole{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Role:      role,
		CreatedBy: createdBy,
	})
	if err == nil {
		log.Printf("[UserService.EnsureUserIDByEmailWithRole] User created: %s", created.ID)
		return created.ID, nil
	}

	var dup AlreadyExistsError
	if errors.As(err, &dup) {
		log.Printf("[UserService.EnsureUserIDByEmailWithRole] Race condition detected, retrying lookup for email: %s", email)
		id2, err2 := s.userRepo.GetIDByEmail(ctx, email)
		if err2 != nil {
			if errors.Is(err2, repository.ErrNotFound) {
				log.Printf("[UserService.EnsureUserIDByEmailWithRole] Failed to create and lookup user: %v", err)
				return uuid.Nil, DBError{Err: err}
			}
			log.Printf("[UserService.EnsureUserIDByEmailWithRole] Failed on retry: %v", err2)
			return uuid.Nil, DBError{Err: err2}
		}
		return id2, nil
	}
	log.Printf("[UserService.EnsureUserIDByEmailWithRole] Failed to create user: %v", err)
	return uuid.Nil, err
}

func (s *UserService) ListStudentsForMentor(ctx context.Context, mentorUserID uuid.UUID) ([]domain.User, error) {
	log.Printf("[UserService.ListStudentsForMentor] Listing students for mentor: %s", mentorUserID)
	users, err := s.userRepo.ListStudentsForMentor(ctx, mentorUserID)
	if err != nil {
		log.Printf("[UserService.ListStudentsForMentor] Failed to list students: %v", err)
		return nil, DBError{Err: err}
	}
	log.Printf("[UserService.ListStudentsForMentor] Retrieved %d students for mentor %s", len(users), mentorUserID)
	return users, nil
}

// UpdateProfile updates a user's first/last name and returns the updated user.
func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, firstName, lastName string) (string, string, error) {
	log.Printf("[UserService.UpdateProfile] Updating profile for user %s: firstName: %s, lastName: %s", userID, firstName, lastName)
	if err := domain.ValidateNames(firstName, lastName); err != nil {
		log.Printf("[UserService.UpdateProfile] Validation error: %v", err)
		return "", "", err
	}
	firstName, lastName, err := s.userRepo.UpdateUserNames(ctx, userID, firstName, lastName)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[UserService.UpdateProfile] User not found: %s", userID)
			return "", "", NotFoundError{"user", userID.String()}
		}
		log.Printf("[UserService.UpdateProfile] Failed to update profile: %v", err)
		return "", "", DBError{Err: err}
	}
	log.Printf("[UserService.UpdateProfile] Profile updated for user %s", userID)
	return firstName, lastName, nil
}

type BulkStudentsResult struct {
	Created       int               `json:"created"`
	Failed        int               `json:"failed"`
	Skipped       int               `json:"skipped"`
	Errors        []StudentRowError `json:"errors"`
	ParseWarnings []StudentRowError `json:"parseWarnings,omitempty"`
}

func (s *UserService) BulkUpsertStudents(
	ctx context.Context,
	rows []domain.NewStudent,
	actor uuid.UUID,
	dryRun bool,
) (BulkStudentsResult, error) {
	log.Printf("[UserService.BulkUpsertStudents] Processing %d students (dryRun: %t)", len(rows), dryRun)

	res := BulkStudentsResult{}
	seen := make(map[string]struct{}) // dedupe emails within file

	for i, r := range rows {
		email := strings.ToLower(strings.TrimSpace(r.Email))
		if _, ok := seen[email]; ok {
			res.Skipped++
			res.Errors = append(res.Errors, StudentRowError{Row: i + 2, Email: email, Err: "duplicate in file"})
			continue
		}
		seen[email] = struct{}{}

		if dryRun {
			// probe only
			_, emailErr := s.userRepo.FindByEmail(ctx, email)
			_, tazErr := s.userRepo.FindByTaz(ctx, r.Taz)
			if emailErr == nil || tazErr == nil {
				res.Failed++
				res.Errors = append(res.Errors, StudentRowError{Row: i + 2, Email: email, Err: "user already exists"})
				continue
			}
			probeFailed := false
			if !errors.Is(emailErr, repository.ErrNotFound) {
				probeFailed = true
				res.Errors = append(res.Errors, StudentRowError{Row: i + 2, Email: email, Err: emailErr.Error()})
			}
			if !errors.Is(tazErr, repository.ErrNotFound) {
				probeFailed = true
				res.Errors = append(res.Errors, StudentRowError{Row: i + 2, Email: email, Err: tazErr.Error()})
			}
			if probeFailed {
				res.Failed++
			}
			continue
		}

		r.CreatedBy = actor
		err := s.userRepo.UpsertStudent(ctx, r)
		if err != nil {
			res.Failed++
			res.Errors = append(res.Errors, StudentRowError{Row: i + 2, Email: email, Err: err.Error()})
			log.Printf("[UserService.BulkUpsertStudents] Error at row %d (email: %s): %v", i+2, email, err)
		} else {
			res.Created++
		}

	}
	log.Printf("[UserService.BulkUpsertStudents] Completed: created %d, failed %d, skipped %d", res.Created, res.Failed, res.Skipped)
	return res, nil
}

func (s *UserService) ListStudents(ctx context.Context) ([]domain.User, error) {
	log.Printf("[UserService.ListStudents] Listing all students")
	users, err := s.userRepo.ListStudents(ctx)
	if err != nil {
		log.Printf("[UserService.ListStudents] Failed to list students: %v", err)
		return nil, DBError{Err: err}
	}
	log.Printf("[UserService.ListStudents] Retrieved %d students", len(users))
	return users, nil
}
