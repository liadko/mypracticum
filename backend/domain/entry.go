package domain

import (
	"errors"
	"time"
)

type Entry struct {
	ID        string
	UserID    string
	ContactID string
	Date      string // "YYYY-MM-DD"
	Approved  bool
}

// Validate ensures business rules at the domain level.
func (e Entry) Validate() error {
	if e.UserID == "" || e.ContactID == "" {
		return errors.New("userID and contactID must be provided")
	}
	// simple date format check
	if _, err := time.Parse("2006-01-02", e.Date); err != nil {
		return errors.New("date must be YYYY-MM-DD")
	}
	return nil
}
