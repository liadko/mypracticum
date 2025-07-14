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
	ID        uuid.UUID // UUID
	UserID    uuid.UUID // FK to the owning user (your mom)
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

// Validate enforces all the business rules for Contact.
// It returns an error if any invariant is broken.
func (contact Contact) Validate() error {
	var errs []string

	if contact.UserID == uuid.Nil {
		errs = append(errs, "userID must be provided")
	}
	if strings.TrimSpace(contact.Name) == "" {
		errs = append(errs, "name must be provided")
	}

	switch contact.Type {
	case Mentor:
		if contact.Email == nil || strings.TrimSpace(*contact.Email) == "" {
			errs = append(errs, "email is required for mentors")
		}
		fallthrough
	case Therapist:
		if contact.Phone == nil || strings.TrimSpace(*contact.Phone) == "" {
			errs = append(errs, "phone is required for mentors and therapists")
		}
		if contact.Specialty != nil && strings.TrimSpace(*contact.Specialty) == "" {
			errs = append(errs, "specialty, if provided, cannot be blank")
		}
	case Client:
		// no extra requirements
	default:
		errs = append(errs, "invalid contact type")
	}

	if len(errs) > 0 {
		return ValidationError(strings.Join(errs, "; "))
	}

	return nil
}

func NewContactFrom(userID uuid.UUID, nc NewContact) (Contact, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return Contact{}, fmt.Errorf("generate contact ID: %w", err)
	}
	contact := Contact{
		ID:        id,
		UserID:    userID,
		Type:      nc.Type,
		Name:      nc.Name,
		Email:     nc.Email,
		Phone:     nc.Phone,
		Specialty: nc.Specialty,
	}
	if err := contact.Validate(); err != nil {
		return Contact{}, err
	}

	return contact, nil
}

func UpdatedContact(userID uuid.UUID, contactID uuid.UUID, nc NewContact) (Contact, error) {

	contact := Contact{
		ID:        contactID,
		UserID:    userID,
		Type:      nc.Type,
		Name:      nc.Name,
		Email:     nc.Email,
		Phone:     nc.Phone,
		Specialty: nc.Specialty,
	}
	if err := contact.Validate(); err != nil {
		return Contact{}, err
	}

	return contact, nil
}
