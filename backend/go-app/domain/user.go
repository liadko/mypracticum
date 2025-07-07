package domain

import (
	"regexp"
)

// User is your core authenticated-entity.
type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// NewUser builds and validates a User.
func NewUser(email string) (*User, error) {
	u := &User{
		Email: email,
	}
	if err := u.Validate(); err != nil {
		return nil, err
	}
	return u, nil
}

// Validate enforces basic rules.
func (u *User) Validate() error {
	if u.Email == "" {
		return ValidationError("email must not be empty")
	}
	// very simple regex check
	re := regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	if !re.MatchString(u.Email) {
		return ValidationError("email invalid format")
	}
	return nil
}
