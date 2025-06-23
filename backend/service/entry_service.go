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

func (s *EntryService) AddEntry(ctx context.Context, e domain.Entry) (domain.Entry, error) {
	if err := e.Validate(); err != nil {
		return domain.Entry{}, err
	}
	return s.repo.Create(ctx, e)
}

func (s *EntryService) RemoveEntry(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *EntryService) ListEntries(ctx context.Context, userID string) ([]domain.Entry, error) {
	return s.repo.ListByUser(ctx, userID)
}
