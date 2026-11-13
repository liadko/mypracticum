package service

import (
	"fmt"
	"time"

	"mypracticum/backend/domain"
)

func validateEntryDate(entryDate time.Time, cutoff *time.Time) error {
	if cutoff == nil || !entryDate.Before(*cutoff) {
		return nil
	}
	// Shown to the student as-is, in the same words the calendar uses.
	return domain.ValidationError(fmt.Sprintf("לא ניתן לדווח לפני %s", cutoff.Format("02/01/2006")))
}
