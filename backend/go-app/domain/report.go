package domain

import (
	"time"

	"github.com/google/uuid"
)

// StudentReportSummary contains the hour totals used by the analyst dashboard.
// Regular entries are one hour each; manual entries contribute their hours value.
type StudentReportSummary struct {
	ClientHours         int64
	MentorApprovedHours int64
	MentorPendingHours  int64
	TherapistHours      int64
	ManualHours         int64
	ManualHoursByCategory ManualHoursByCategory
	LastReportedDate    *time.Time
	SignatureSubmitted  bool
}

type ManualHoursByCategory struct {
	Client    int64
	Mentor    int64
	Therapist int64
}

type StudentSummary struct {
	ID        uuid.UUID
	FirstName string
	LastName  string
	Email     string
	Class     string
	Taz       string
	Summary   StudentReportSummary
}

type StudentSearchPage struct {
	Students   []StudentSummary
	Total      int64
	Page       int
	Limit      int
	TotalPages int
}

type ReportEvent struct {
	ID          uuid.UUID
	Date        time.Time
	Category    ContactType
	ContactID   uuid.UUID
	ContactName string
	Approved    bool
	Hours       int64
	Source      string
}

type ReportManualEntry struct {
	ID        uuid.UUID
	Hours     int64
	Cause     string
	Type      ContactType
	CreatedAt time.Time
	BatchID   *uuid.UUID
}

type ReportContact struct {
	ID                       uuid.UUID
	Type                     ContactType
	Name                     string
	Email                    string
	Phone                    string
	Specialty                string
	ClientInstitution        string
	ClientTrainingCenterInfo string
	Hours                    int64
	ApprovedHours            int64
	PendingHours             int64
}

type StudentReport struct {
	Student       StudentSummary
	Events        []ReportEvent
	ManualEntries []ReportManualEntry
	Contacts      []ReportContact
}
