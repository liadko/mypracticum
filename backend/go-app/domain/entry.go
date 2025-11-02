package domain

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Entry struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	ContactID uuid.UUID
	Date      time.Time
	Approved  bool
}

type NewEntry struct {
	ContactID uuid.UUID
	DateStr   string // "YYYY-MM-DD"
}

// ManualEntry represents an administrative adjustment to a user's hours.
type ManualEntry struct {
	ID     uuid.UUID
	UserID uuid.UUID // The user this entry belongs to
	Hours  int
	Cause  string // The administrative reason for the entry
	Type   string // "client", "mentor", or "therapist"

	BatchID   *uuid.UUID // optional batch ID for grouping
	CreatedAt time.Time
}

// NewManualEntry is the input struct for creating a new manual entry.
type NewManualEntry struct {
	UserID  uuid.UUID
	Hours   int
	Cause   string
	Type    string
	BatchID *uuid.UUID
}

// Validate checks all business rules and returns a ValidationError if anything is wrong.
func (e Entry) Validate() error {
	var errs []string

	if e.UserID == uuid.Nil {
		errs = append(errs, "userID must be provided")
	}
	if e.ContactID == uuid.Nil {
		errs = append(errs, "contactID must be provided")
	}
	// the Date field is already a time.Time here, so just check
	if e.Date.IsZero() {
		errs = append(errs, "date must be provided")
	}
	if e.Date.After(time.Now().Add(time.Hour * 24)) {
		errs = append(errs, "date cannot be in the future")
	}

	if len(errs) > 0 {
		return ValidationError(strings.Join(errs, "; "))
	}
	return nil
}

func NewEntryFrom(userID uuid.UUID, ne NewEntry) (Entry, error) {
	// 1) parse the date
	date, err := time.Parse("2006-01-02", ne.DateStr)
	if err != nil {
		return Entry{}, ValidationError("date must be YYYY-MM-DD")
	}

	id, err := uuid.NewRandom()
	if err != nil {
		return Entry{}, fmt.Errorf("generate contact ID: %w", err)
	}

	// 2) build the Entry
	entry := Entry{
		ID:        id,
		UserID:    userID,
		ContactID: ne.ContactID,
		Date:      date,
		Approved:  false,
	}

	// 3) then validate it
	if err := entry.Validate(); err != nil {
		return Entry{}, err
	}

	return entry, nil
}

// FailedManualEntry details a single entry that failed to be created
// during a bulk operation.
type FailedManualEntry struct {
	Input NewManualEntry `json:"input"`
	Error string         `json:"error"`
}

// BulkAddManualEntriesResult summarizes the outcome of the bulk operation.
type BulkAddManualEntriesResult struct {
	CreatedCount int                 `json:"createdCount"`
	FailedCount  int                 `json:"failedCount"`
	Failures     []FailedManualEntry `json:"failures"`
	BatchID      *uuid.UUID          `json:"batchId,omitempty"`
}

// This matches the DTO from entry/dto.go
type DeleteManualEntriesResult struct {
	EntriesDeleted int64 `json:"entriesDeleted"`
	BatchesDeleted int64 `json:"batchesDeleted"`
}
