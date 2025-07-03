package domain

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// ContactType enumerates the allowed contact roles.
type ContactType string

const (
	Client    ContactType = "client"
	Mentor    ContactType = "mentor"
	Therapist ContactType = "therapist"
)

var validContactTypes = []ContactType{
	Client,
	Mentor,
	Therapist,
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

// Contact holds the core data for a person you can log hours against.
type Contact struct {
	ID        string // UUID
	UserID    string // FK to the owning user (your mom)
	Type      ContactType
	Name      string
	Email     *string // only required for mentors
	Phone     *string // only required for mentors
	Specialty *string // optional,
}

type NewContact struct {
	Type      ContactType
	Name      string
	Email     *string
	Phone     *string
	Specialty *string
}

// // Validate enforces all the business rules for Contact.
// // It returns an error if any invariant is broken.
// func (c Contact) Validate() error {
// 	if c.UserID == "" {
// 		return errors.New("userID is required")
// 	}
// 	if !IsValidContactType(c.Type) {
// 		return fmt.Errorf("invalid contact type %q", c.Type)
// 	}
// 	if c.Name == "" {
// 		return errors.New("name is required")
// 	}
// 	if c.Type == ContactTypeMentor {
// 		if c.Email == nil || *c.Email == "" {
// 			return errors.New("mentors must have an email")
// 		}
// 		if c.Phone == nil || *c.Phone == "" {
// 			return errors.New("mentors must have a phone number")
// 		}
// 	}
// 	if c.Specialty != nil && !IsValidSpecialty(*c.Specialty) {
// 		return fmt.Errorf("invalid specialty %q", *c.Specialty)
// 	}
// 	return nil
// }

func NewContactFrom(userID string, nc NewContact) (Contact, error) {
	var errs []string

	if strings.TrimSpace(userID) == "" {
		errs = append(errs, "userID must be provided")
	}
	if strings.TrimSpace(nc.Name) == "" {
		errs = append(errs, "name must be provided")
	}

	switch nc.Type {
	case Mentor:
		if nc.Email == nil || strings.TrimSpace(*nc.Email) == "" {
			errs = append(errs, "email is required for mentors")
		}
		fallthrough
	case Therapist:
		if nc.Phone == nil || strings.TrimSpace(*nc.Phone) == "" {
			errs = append(errs, "phone is required for mentors and therapists")
		}
		if nc.Specialty != nil && strings.TrimSpace(*nc.Specialty) == "" {
			errs = append(errs, "specialty, if provided, cannot be blank")
		}
	case Client:
		// no extra requirements
	default:
		errs = append(errs, "invalid contact type")
	}

	// optional specialty: if present, must be non-empty

	if len(errs) > 0 {
		return Contact{}, fmt.Errorf("contact validation failed: %s", strings.Join(errs, "; "))
	}

	return Contact{
		ID:        uuid.NewString(),
		UserID:    userID,
		Type:      nc.Type,
		Name:      nc.Name,
		Email:     nc.Email,
		Phone:     nc.Phone,
		Specialty: nc.Specialty,
	}, nil
}
