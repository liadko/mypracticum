package domain

import (
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

// domain/user.go
type User struct {
	ID        uuid.UUID
	FirstName string
	LastName  string
	Email     string
	Class     string
	Taz       string

	Signature []byte

	CreatedAt time.Time
	CreatedBy uuid.UUID

	Roles []string
}

type NewUserWithRole struct {
	FirstName string
	LastName  string
	Email     string
	Role      string
	CreatedBy uuid.UUID
}

type NewStudent struct {
	FirstName string
	LastName  string
	Email     string
	Class     string
	Taz       string
	CreatedBy uuid.UUID
}

// NewUserFromWithRole builds a User from a NewUserWithRole struct,
// Returns a User with validated names, email, and a single Role.
func NewUserFromWithRole(nuw NewUserWithRole) (User, error) {
	return NewUserFrom(nuw.FirstName, nuw.LastName, nuw.Email, nuw.CreatedBy, []string{nuw.Role})
}

// NewUserFrom builds a user with the given names, email and roles,
// sets ID and CreatedAt automatically, and runs Validate.
func NewUserFrom(firstName, lastName, email string, createdBy uuid.UUID, roles []string) (User, error) {
	u := User{
		ID:        uuid.New(),
		FirstName: strings.TrimSpace(firstName),
		LastName:  strings.TrimSpace(lastName),
		Email:     strings.ToLower(strings.TrimSpace(email)),
		Roles:     roles,
		CreatedAt: time.Now(),
		CreatedBy: createdBy,
	}
	if err := u.Validate(); err != nil {
		return User{}, err
	}
	return u, nil
}

// pre-compile once for efficiency
var emailRegex = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// Validate enforces:
//   - non-empty first & last names
//   - non-empty, valid-format email
//   - at least one role assigned
func (u *User) Validate() error {
	if u.FirstName == "" {
		return ValidationError("first name must not be empty")
	}
	if u.LastName == "" {
		return ValidationError("last name must not be empty")
	}
	if u.Email == "" {
		return ValidationError("email must not be empty")
	}
	if !emailRegex.MatchString(u.Email) {
		return ValidationError("invalid email format")
	}
	if len(u.Roles) == 0 {
		return ValidationError("user must have at least one role")
	}
	if u.CreatedBy == uuid.Nil {
		return ValidationError("created by must not be empty")
	}
	return nil
}

func ValidateNames(firstName, lastName string) error {
	if strings.TrimSpace(firstName) == "" {
		return ValidationError("first name must not be empty")
	}
	if strings.TrimSpace(lastName) == "" {
		return ValidationError("last name must not be empty")
	}
	return nil
}

// IsMentor checks if the user has the "mentor" role.
func (u *User) IsMentor() bool {
	for _, r := range u.Roles {
		if r == "mentor" {
			return true
		}
	}
	return false
}
