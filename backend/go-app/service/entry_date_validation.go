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
	return domain.ValidationError(fmt.Sprintf("cannot report before %s", cutoff.Format("2006-01-02")))
}
