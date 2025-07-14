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
	if e.Date.After(time.Now()) {
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
