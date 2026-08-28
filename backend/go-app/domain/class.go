package domain

import (
	"time"

	"github.com/google/uuid"
)

// Class is the canonical cohort assigned to a user.
type Class struct {
	ID                 uuid.UUID
	Name               string
	ClientStartDate    *time.Time
	MentorStartDate    *time.Time
	TherapistStartDate *time.Time
}
