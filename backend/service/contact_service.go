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

func (s *ContactService) AddContact(ctx context.Context, userID string, newContact domain.NewContact) (domain.Contact, error) {
	// build & validate in one shot
	contact, err := domain.NewContactFrom(userID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	return s.repo.Create(ctx, userID, contact)
}

func (s *ContactService) UpdateContact(ctx context.Context, userID string, contactID string, newContact domain.NewContact) (domain.Contact, error) {
	if err := c.Validate(); err != nil {
		return domain.Contact{}, err
	}
	return s.repo.Create(ctx, c)
}

func (s *ContactService) RemoveContact(ctx context.Context, userID, contactID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *ContactService) ListContacts(ctx context.Context, userID string) ([]domain.Contact, error) {
	return s.repo.ListByUser(ctx, userID)
}
