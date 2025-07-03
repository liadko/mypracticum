package service

import (
	"context"
	"errors"
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
		return domain.Contact{}, DBError{Err: err}
	}

	return s.repo.Create(ctx, userID, contact)
}

func (s *ContactService) UpdateContact(ctx context.Context, userID, contactID string, newContact domain.NewContact) (domain.Contact, error) {
	// build & validate in one shot
	contact, err := domain.UpdatedContact(userID, contactID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	updated, err := s.repo.Update(ctx, userID, contactID, contact)
	if errors.Is(err, repository.ErrNotFound) {
		return domain.Contact{}, NotFoundError{"contact", contactID}
	}
	if err != nil {
		return domain.Contact{}, DBError{Err: err}
	}
	return updated, nil

}

// func (s *ContactService) RemoveContact(ctx context.Context, userID, contactID string) error {
// 	return s.repo.Delete(ctx, userID, userID)
// }

func (s *ContactService) ListContacts(ctx context.Context, userID string) ([]domain.Contact, error) {
	return s.repo.ListByUser(ctx, userID)
}
