package domain

import (
	"fmt"
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

// Validate ensures business rules at the domain level.
func (e Entry) Validate() error {
	var errs []string

	if e.ID == "" {
		errs = append(errs, "ID is required")
	}
	if e.UserID == "" {
		errs = append(errs, "UserID is required")
	}
	if e.ContactID == "" {
		errs = append(errs, "ContactID is required")
	}

	if e.Date.IsZero() {
		errs = append(errs, "Date is required")
	} else if e.Date.After(time.Now()) {
		errs = append(errs, "Date cannot be in the future")
	}

	if len(errs) > 0 {
		return fmt.Errorf("validation failed: %s", strings.Join(errs, "; "))
	}
	return nil
}

func NewEntryFrom(userID string, newEntry NewEntry) (Entry, error) {
	var errs []string

	if userID == "" {
		errs = append(errs, "userID must be provided")
	}
	if newEntry.ContactID == "" {
		errs = append(errs, "contactID must be provided")
	}

	date, err := time.Parse("2006-01-02", newEntry.DateStr)
	if err != nil {
		errs = append(errs, "date must be in YYYY-MM-DD format")
	} else if date.After(time.Now()) {
		// disallow future dates
		errs = append(errs, "date cannot be in the future")
	}

	if len(errs) > 0 {
		return Entry{}, fmt.Errorf("validation failed: %s", strings.Join(errs, "; "))
	}

	return Entry{
		ID:        uuid.NewString(),
		UserID:    userID,
		ContactID: newEntry.ContactID,
		Date:      date,
		Approved:  false,
	}, nil
}
