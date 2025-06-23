package service

import (
	"context"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
)

type ContactService struct {
	repo repository.ContactRepository
}

func NewContactService(repo repository.ContactRepository) *ContactService {
	return &ContactService{repo: repo}
}

func (s *ContactService) AddContact(ctx context.Context, c domain.Contact) (domain.Contact, error) {
	if err := c.Validate(); err != nil {
		return domain.Contact{}, err
	}
	return s.repo.Create(ctx, c)
}

func (s *ContactService) RemoveContact(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *ContactService) ListContacts(ctx context.Context, userID string) ([]domain.Contact, error) {
	return s.repo.ListByUser(ctx, userID)
}
