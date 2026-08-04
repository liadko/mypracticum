package domain

import (
	"time"

	"github.com/google/uuid"
)

type MentorSubmittedHours struct {
	Approved int64
	Pending  int64
}

type MentorSummary struct {
	ID                 uuid.UUID
	FirstName          string
	LastName           string
	Email              string
	SignatureSubmitted bool
	StudentCount       int64
	SubmittedHours     MentorSubmittedHours
	Students           []MentorStudentReference
}

type MentorStudentReference struct {
	ID        uuid.UUID
	FirstName string
	LastName  string
}

type MentorSearchPage struct {
	Mentors    []MentorSummary
	Total      int64
	Page       int
	Limit      int
	TotalPages int
}

type MentorStudent struct {
	ID                 uuid.UUID
	FirstName          string
	LastName           string
	Email              string
	Class              string
	Taz                string
	SubmittedHours     MentorSubmittedHours
}

type MentorEvent struct {
	ID              uuid.UUID
	Date            time.Time
	StudentID       uuid.UUID
	StudentName     string
	StudentClass    string
	MentorContactID uuid.UUID
	Approved        bool
	Hours           int64
	Source          string
}

type MentorReport struct {
	Mentor   MentorSummary
	Students []MentorStudent
	Events   []MentorEvent
}
