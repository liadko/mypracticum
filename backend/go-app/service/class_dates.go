package service

import (
	"context"
	"errors"
	"log"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func (s *UserService) UpdateClassReportingStartDates(ctx context.Context, id uuid.UUID, dates domain.Class) (domain.Class, error) {
	if dates.ClientStartDate == nil || dates.MentorStartDate == nil || dates.TherapistStartDate == nil {
		return domain.Class{}, ValidationError("all reporting start dates are required")
	}
	started := time.Now()
	class, err := s.userRepo.UpdateClassReportingStartDates(ctx, id, dates)
	if errors.Is(err, repository.ErrNotFound) {
		return domain.Class{}, NotFoundError{"class", id.String()}
	}
	if err != nil {
		return domain.Class{}, DBError{Err: err}
	}
	log.Printf("[UserService.UpdateClassReportingStartDates] Updated class %s, elapsed=%s", id, time.Since(started))
	return class, nil
}
