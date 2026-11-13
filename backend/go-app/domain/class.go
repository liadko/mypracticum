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

	// PrivateClinicCap is how many private-clinic client hours a student in
	// this class may log. Students without a class get DefaultPrivateClinicCap.
	PrivateClinicCap int
}

// DefaultPrivateClinicCap applies to students without a class, and to new
// classes unless the admin sets something else.
const DefaultPrivateClinicCap = 160

// PrivateClinicUsage is what the cap check needs to know about one contact.
type PrivateClinicUsage struct {
	IsPrivateClinic bool  // the contact is a client treated in a private clinic
	Used            int64 // the student's private-clinic calendar entries so far
	Cap             int64
}

// Reached reports whether one more private-clinic hour would exceed the cap.
func (u PrivateClinicUsage) Reached() bool {
	return u.Used >= u.Cap
}
