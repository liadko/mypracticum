package report

import (
	"time"

	"github.com/google/uuid"
)

type StudentSummaryResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Email     string    `json:"email"`
	Class     string    `json:"class"`
	Taz       string    `json:"taz"`
	Summary   Summary  `json:"summary"`
}

type Summary struct {
	SubmittedHours     SubmittedHours `json:"submittedHours"`
	ManualHours        ManualHours    `json:"manualHours"`
	LastReportedDate   string         `json:"lastReportedDate,omitempty"`
	SignatureSubmitted bool           `json:"signatureSubmitted"`
}

type ManualHours struct {
	Client    int64 `json:"client"`
	Mentor    int64 `json:"mentor"`
	Therapist int64 `json:"therapist"`
}

type SubmittedHours struct {
	Client         int64 `json:"client"`
	MentorApproved int64 `json:"mentorApproved"`
	MentorPending  int64 `json:"mentorPending"`
	Therapist      int64 `json:"therapist"`
}

type ReportEventResponse struct {
	ID          uuid.UUID `json:"id"`
	Date        string    `json:"date"`
	Category    string    `json:"category"`
	ContactID   uuid.UUID `json:"contactId"`
	ContactName string    `json:"contactName"`
	Approved    bool      `json:"approved"`
	Hours       int64     `json:"hours"`
	Source      string    `json:"source"`
}

type ManualEntryResponse struct {
	ID        uuid.UUID  `json:"id"`
	Hours     int64      `json:"hours"`
	Title     string     `json:"title"`
	Category  string     `json:"category"`
	CreatedAt time.Time  `json:"createdAt"`
	BatchID   *uuid.UUID `json:"batchId,omitempty"`
}

type ContactResponse struct {
	ID                       uuid.UUID `json:"id"`
	Type                     string    `json:"type"`
	Name                     string    `json:"name"`
	Email                    string    `json:"email,omitempty"`
	Phone                    string    `json:"phone,omitempty"`
	Specialty                string    `json:"specialty,omitempty"`
	ClientInstitution        string    `json:"clientInstitution,omitempty"`
	ClientTrainingCenterInfo string    `json:"clientTrainingCenterInfo,omitempty"`
	Hours                    int64     `json:"hours"`
	ApprovedHours            int64     `json:"approvedHours"`
	PendingHours             int64     `json:"pendingHours"`
}

type ContactsResponse struct {
	Mentors    []ContactResponse `json:"mentors"`
	Clients    []ContactResponse `json:"clients"`
	Therapists []ContactResponse `json:"therapists"`
}

type StudentReportResponse struct {
	Student       StudentSummaryResponse `json:"student"`
	Events        []ReportEventResponse  `json:"events"`
	ManualEntries []ManualEntryResponse  `json:"manualEntries"`
	Contacts      ContactsResponse       `json:"contacts"`
}

type MentorHoursResponse struct {
	MentorApproved int64 `json:"mentorApproved"`
	MentorPending  int64 `json:"mentorPending"`
}

type MentorSummaryResponse struct {
	ID                 uuid.UUID           `json:"id"`
	FirstName          string              `json:"firstName"`
	LastName           string              `json:"lastName"`
	Email              string              `json:"email"`
	SignatureSubmitted bool                `json:"signatureSubmitted"`
	StudentCount       int64               `json:"studentCount"`
	SubmittedHours     MentorHoursResponse `json:"submittedHours"`
	Students           []MentorStudentReferenceResponse `json:"students"`
}

type MentorStudentReferenceResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
}

type MentorStudentResponse struct {
	ID             uuid.UUID           `json:"id"`
	FirstName      string              `json:"firstName"`
	LastName       string              `json:"lastName"`
	Email          string              `json:"email"`
	Class          string              `json:"class"`
	Taz            string              `json:"taz"`
	SubmittedHours MentorHoursResponse `json:"submittedHours"`
}

type MentorEventResponse struct {
	ID              uuid.UUID `json:"id"`
	Date            string    `json:"date"`
	StudentID       uuid.UUID `json:"studentId"`
	StudentName     string    `json:"studentName"`
	StudentClass    string    `json:"studentClass"`
	MentorContactID uuid.UUID `json:"mentorContactId"`
	Approved        bool      `json:"approved"`
	Hours           int64     `json:"hours"`
	Source          string    `json:"source"`
}

type MentorListResponse struct {
	Mentors    []MentorSummaryResponse `json:"mentors"`
	Total      int64                   `json:"total"`
	Page       int                     `json:"page"`
	Limit      int                     `json:"limit"`
	TotalPages int                     `json:"totalPages"`
}

type MentorReportResponse struct {
	Mentor   MentorSummaryResponse  `json:"mentor"`
	Students []MentorStudentResponse `json:"students"`
	Events   []MentorEventResponse  `json:"events"`
}
