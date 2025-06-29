package service

import (
	"context"
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
		return domain.Entry{}, fmt.Errorf("creating entry: %w", err)
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

	if err := s.repo.Delete(ctx, entryID, userID); err != nil {
		return fmt.Errorf("deleting entry: %w", err)
	}
	return nil
}

func (s *EntryService) ListEntries(ctx context.Context, userID string) ([]domain.Entry, error) {
	return s.repo.ListByUser(ctx, userID)
}
