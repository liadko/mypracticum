package service

import (
	"context"
	"errors"
	"fmt"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

type EntryService struct {
	repo repository.EntryRepo
}

func NewEntryService(repo repository.EntryRepo) *EntryService {
	return &EntryService{repo: repo}
}

func (s *EntryService) AddEntry(
	ctx context.Context,
	userID uuid.UUID,
	newEntry domain.NewEntry, // or just (contactID, dateStr string)
) (domain.Entry, error) {

	// build & validate in one shot
	entry, err := domain.NewEntryFrom(userID, newEntry)
	if err != nil {
		return domain.Entry{}, err
	}

	// send to the repo
	createdEntry, err := s.repo.Create(ctx, entry)

	if err != nil {
		return domain.Entry{}, DBError{Err: err}
	}

	return createdEntry, nil
}

func (s *EntryService) RemoveEntry(ctx context.Context, entryID, userID uuid.UUID) error {
	if entryID == uuid.Nil {
		return fmt.Errorf("invalid entry id")
	}
	if userID == uuid.Nil {
		return fmt.Errorf("missing user")
	}

	err := s.repo.DeleteIfNotApproved(ctx, entryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// tell handler to return 404
			return NotFoundError{"entry", entryID.String()}
		}
		if errors.Is(err, repository.ErrAlreadyApproved) {
			// tell handler to return 400
			return ValidationError("cannot remove an approved entry")
		}
		// wrap real DB errors into 500
		return DBError{Err: err}
	}

	return nil
}

func (s *EntryService) ListStudentEntries(ctx context.Context, studentUserID uuid.UUID) ([]domain.Entry, error) {
	list, err := s.repo.ListByStudent(ctx, studentUserID)
	if err != nil {
		return nil, DBError{Err: err}
	}
	return list, nil
}

func (s *EntryService) ListMentorEntries(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Entry, error) {
	list, err := s.repo.ListByMentor(ctx, mentorUserID)
	if err != nil {
		return nil, DBError{Err: err}
	}
	return list, nil
}

func (s *EntryService) SetApproval(
	ctx context.Context,
	mentorID uuid.UUID,
	entryID uuid.UUID,
	approved bool,
) (domain.Entry, error) {

	// fetch entry + its mentor link
	linked, err := s.repo.IsEntryLinkedToMentor(ctx, entryID, mentorID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		return domain.Entry{}, DBError{Err: err}
	}
	if !linked {
		return domain.Entry{}, ForbiddenError{"not mentor of this entry"}
	}

	// set approver_id := mentorID (approved) or NULL (unapprove)
	var approver *uuid.UUID
	if approved {
		approver = &mentorID
	}

	updated, err := s.repo.UpdateApproval(ctx, entryID, approver)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		return domain.Entry{}, DBError{Err: err}
	}
	return updated, nil
}
