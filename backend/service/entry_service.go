package service

import (
	"context"
	"errors"
	"fmt"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
)

type EntryService struct {
	repo repository.EntryRepository
}

func NewEntryService(repo repository.EntryRepository) *EntryService {
	return &EntryService{repo: repo}
}

func (s *EntryService) AddEntry(
	ctx context.Context,
	userID string,
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

func (s *EntryService) RemoveEntry(ctx context.Context, entryID, userID string) error {
	if entryID == "" {
		return fmt.Errorf("invalid entry id")
	}
	if userID == "" {
		return fmt.Errorf("missing user")
	}

	// MAYBE TODO: check if the fetch some stuff and check if the entry is approved.

	err := s.repo.Delete(ctx, entryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// tell handler to return 404
			return NotFoundError{"entry", entryID}
		}
		// wrap real DB errors into 500
		return DBError{Err: err}
	}

	return nil
}

func (s *EntryService) ListEntries(ctx context.Context, userID string) ([]domain.Entry, error) {
	list, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		return nil, DBError{Err: err}
	}
	return list, nil
}
