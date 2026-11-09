package domain

import "strings"

// StudentStatus says whether a student's hours are still open for changes.
type StudentStatus string

const (
	StudentActive StudentStatus = "active"
	// StudentFrozen means the hours forms are being sent out. The student and
	// their mentors can look but not change anything; admins are unrestricted.
	StudentFrozen StudentStatus = "frozen"
)

// FreezeReason is why a student was frozen.
type FreezeReason string

const (
	FreezeOnLeave     FreezeReason = "on_leave"
	FreezeLeftProgram FreezeReason = "left_program"
	FreezeFinished    FreezeReason = "finished"
	FreezeOther       FreezeReason = "other"
)

// IsValid reports whether r is one of the known reasons.
func (r FreezeReason) IsValid() bool {
	switch r {
	case FreezeOnLeave, FreezeLeftProgram, FreezeFinished, FreezeOther:
		return true
	}
	return false
}

// StatusDetails is the shape of users.status_details. Reason and Note describe
// the current freeze; Log is an append-only history that survives unfreezing.
type StatusDetails struct {
	Reason FreezeReason `json:"reason,omitempty"`
	Note   string       `json:"note,omitempty"`
	Log    []string     `json:"log,omitempty"`
}

// StatusChange is a requested transition for one student.
type StatusChange struct {
	Status  StudentStatus
	Reason  FreezeReason
	Note    string
	LogLine string
}

// Validate enforces that a freeze has a known reason and an unfreeze has none.
func (c StatusChange) Validate() error {
	switch c.Status {
	case StudentFrozen:
		if !c.Reason.IsValid() {
			return ValidationError("a valid freeze reason is required")
		}
	case StudentActive:
		if c.Reason != "" || strings.TrimSpace(c.Note) != "" {
			return ValidationError("unfreezing does not take a reason or note")
		}
	default:
		return ValidationError("status must be 'active' or 'frozen'")
	}
	return nil
}

// IsFrozen reports whether the user is a frozen student.
func (u User) IsFrozen() bool {
	return u.Status == StudentFrozen
}
