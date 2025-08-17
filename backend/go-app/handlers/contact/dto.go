package contact

import (
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// ContactResponse is the JSON shape returned by the Contacts API.
type ContactResponse struct {
	ID uuid.UUID `json:"id"`
	//UserID    uuid.UUID `json:"userId"`
	Type      string  `json:"type"`
	Name      string  `json:"name"`
	Email     *string `json:"email,omitempty"`
	Phone     *string `json:"phone,omitempty"`
	Specialty *string `json:"specialty,omitempty"`
}

type NewContactDTO struct {
	Type      domain.ContactType `json:"type" binding:"required,oneof=client mentor therapist"`
	Name      string             `json:"name" binding:"required"`
	Email     *string            `json:"email,omitempty"`
	Phone     *string            `json:"phone,omitempty"`
	Specialty *string            `json:"specialty,omitempty"`
}
