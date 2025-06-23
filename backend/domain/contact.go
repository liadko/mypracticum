package domain

import (
	"errors"
	"fmt"
)

// ContactType enumerates the allowed contact roles.
type ContactType string

const (
	ContactTypeClient    ContactType = "client"
	ContactTypeMentor    ContactType = "mentor"
	ContactTypeTherapist ContactType = "therapist"
)

var validContactTypes = []ContactType{
	ContactTypeClient,
	ContactTypeMentor,
	ContactTypeTherapist,
}

// IsValidContactType returns true if t is one of the allowed ContactTypes.
func IsValidContactType(t ContactType) bool {
	for _, v := range validContactTypes {
		if v == t {
			return true
		}
	}
	return false
}

// allowedSpecialties mirrors the DB CHECK(specialty IN (...))
var allowedSpecialties = []string{"clinical", "dynamic", "skateboarder"}

// IsValidSpecialty returns true if s is one of the allowed specialties.
func IsValidSpecialty(s string) bool {
	for _, v := range allowedSpecialties {
		if v == s {
			return true
		}
	}
	return false
}

// Contact holds the core data for a person you can log hours against.
type Contact struct {
	ID        string // UUID
	UserID    string // FK to the owning user (your mom)
	Type      ContactType
	Name      string
	Email     *string // only required for mentors
	Phone     *string // only required for mentors
	Specialty *string // optional, must be one of allowedSpecialties if present
}

// Validate enforces all the business rules for Contact.
// It returns an error if any invariant is broken.
func (c Contact) Validate() error {
	if c.UserID == "" {
		return errors.New("userID is required")
	}
	if !IsValidContactType(c.Type) {
		return fmt.Errorf("invalid contact type %q", c.Type)
	}
	if c.Name == "" {
		return errors.New("name is required")
	}
	if c.Type == ContactTypeMentor {
		if c.Email == nil || *c.Email == "" {
			return errors.New("mentors must have an email")
		}
		if c.Phone == nil || *c.Phone == "" {
			return errors.New("mentors must have a phone number")
		}
	}
	if c.Specialty != nil && !IsValidSpecialty(*c.Specialty) {
		return fmt.Errorf("invalid specialty %q", *c.Specialty)
	}
	return nil
}
