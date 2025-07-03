package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type Entry struct {
	ID        string
	UserID    string
	ContactID string
	Date      time.Time
	Approved  bool
}

type NewEntry struct {
	ContactID string
	DateStr   string // "YYYY-MM-DD"
}

// Validate checks all business rules and returns a ValidationError if anything is wrong.
func (e Entry) Validate() error {
	var errs []string

	if strings.TrimSpace(e.UserID) == "" {
		errs = append(errs, "userID must be provided")
	}
	if strings.TrimSpace(e.ContactID) == "" {
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

func NewEntryFrom(userID string, ne NewEntry) (Entry, error) {
	// 1) parse the date
	date, err := time.Parse("2006-01-02", ne.DateStr)
	if err != nil {
		return Entry{}, ValidationError("date must be YYYY-MM-DD")
	}

	// 2) build the Entry
	entry := Entry{
		ID:        uuid.NewString(),
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
