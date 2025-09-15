package domain

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// ContactType enumerates the allowed contact roles.
type ContactType string

const (
	ClientContact    ContactType = "client"
	MentorContact    ContactType = "mentor"
	TherapistContact ContactType = "therapist"
)

var validContactTypes = []ContactType{
	ClientContact,
	MentorContact,
	TherapistContact,
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
	ID                       uuid.UUID // UUID
	UserID                   uuid.UUID // FK to the owning user
	Type                     ContactType
	Name                     string
	Email                    *string // only required mentors
	Phone                    *string // mentors and therapists
	Specialty                *string // mentors and therapists
	MentorshipType           *string // mentors
	ClientInstitution        *string // clients
	ClientTrainingCenterInfo *string // clients

	MentorUserID *uuid.UUID // nil unless Type=="mentor"
}

type NewContact struct {
	Type                     ContactType
	Name                     string
	Email                    *string
	Phone                    *string
	Specialty                *string
	MentorshipType           *string
	ClientInstitution        *string
	ClientTrainingCenterInfo *string

	MentorUserID *uuid.UUID
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
	case MentorContact:
		if contact.Email == nil || strings.TrimSpace(*contact.Email) == "" {
			errs = append(errs, "email is required for mentors")
		}
		if contact.MentorshipType == nil || (*contact.MentorshipType != "group" && *contact.MentorshipType != "individual") {
			errs = append(errs, "mentorshipType must be 'group' or 'individual'")
		}
		fallthrough
	case TherapistContact:
		if contact.Phone == nil || strings.TrimSpace(*contact.Phone) == "" {
			errs = append(errs, "phone is required for mentors and therapists")
		}
		if contact.Specialty != nil && strings.TrimSpace(*contact.Specialty) == "" {
			errs = append(errs, "specialty, if provided, cannot be blank")
		}
	case ClientContact:
		if contact.ClientInstitution == nil || (*contact.ClientInstitution != "privateClinic" && *contact.ClientInstitution != "trainingCenter") {
			errs = append(errs, "clientInstitution must be 'privateClinic' or 'trainingCenter'")
		}
		if contact.ClientInstitution != nil && *contact.ClientInstitution == "trainingCenter" {
			if contact.ClientTrainingCenterInfo == nil || strings.TrimSpace(*contact.ClientTrainingCenterInfo) == "" {
				errs = append(errs, "clientTrainingCenterInfo is required when clientInstitution is 'trainingCenter'")
			}
		}
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
		ID:                       id,
		UserID:                   userID,
		Type:                     nc.Type,
		Name:                     nc.Name,
		Email:                    nc.Email,
		Phone:                    nc.Phone,
		Specialty:                nc.Specialty,
		MentorshipType:           nc.MentorshipType,
		ClientInstitution:        nc.ClientInstitution,
		ClientTrainingCenterInfo: nc.ClientTrainingCenterInfo,

		MentorUserID: nc.MentorUserID,
	}
	if err := contact.Validate(); err != nil {
		return Contact{}, err
	}

	return contact, nil
}

func UpdatedContact(userID uuid.UUID, contactID uuid.UUID, nc NewContact) (Contact, error) {

	contact := Contact{
		ID:                       contactID,
		UserID:                   userID,
		Type:                     nc.Type,
		Name:                     nc.Name,
		Email:                    nc.Email,
		Phone:                    nc.Phone,
		Specialty:                nc.Specialty,
		MentorshipType:           nc.MentorshipType,
		ClientInstitution:        nc.ClientInstitution,
		ClientTrainingCenterInfo: nc.ClientTrainingCenterInfo,

		MentorUserID: nc.MentorUserID,
	}
	if err := contact.Validate(); err != nil {
		return Contact{}, err
	}

	return contact, nil
}

func MapUsersToStudentContactViews(us []User) []Contact {
	out := make([]Contact, 0, len(us))
	for _, u := range us {
		out = append(out, Contact{
			ID:    u.ID,
			Type:  "student",
			Name:  strings.TrimSpace(u.FirstName + " " + u.LastName),
			Email: &u.Email,
		})
	}
	return out
}
