package service

import (
	"context"
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

	// create a validated domain.Entry
	entry, err := domain.NewEntryFrom(userID, newEntry)
	if err != nil {
		return domain.Entry{}, err
	}

	// send to the repo
	return s.repo.Create(ctx, entry)
}

func (s *EntryService) RemoveEntry(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *EntryService) ListEntries(ctx context.Context, userID string) ([]domain.Entry, error) {
	return s.repo.ListByUser(ctx, userID)
}
