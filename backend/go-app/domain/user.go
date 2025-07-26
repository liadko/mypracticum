package domain

import (
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Role struct {
	ID   int    // matches roles.id
	Name string // e.g. "admin", "mentor"
}

// domain/user.go
type User struct {
	ID        uuid.UUID
	FirstName string
	LastName  string
	Email     string
	Signature []byte
	CreatedAt time.Time

	Roles []Role
}

// NewUser builds a user with the given names, email and roles,
// sets ID and CreatedAt automatically, and runs Validate.
func NewUser(firstName, lastName, email string, roles []Role) (*User, error) {
	u := &User{
		ID:        uuid.New(),
		FirstName: strings.TrimSpace(firstName),
		LastName:  strings.TrimSpace(lastName),
		Email:     strings.ToLower(strings.TrimSpace(email)),
		Roles:     roles,
		CreatedAt: time.Now(),
	}
	if err := u.Validate(); err != nil {
		return nil, err
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
	return nil
}
