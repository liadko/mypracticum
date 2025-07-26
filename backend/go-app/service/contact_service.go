package service

import (
	"context"
	"errors"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

type ContactService struct {
	repo repository.ContactRepo
}

func NewContactService(repo repository.ContactRepo) *ContactService {
	return &ContactService{repo: repo}
}

func (s *ContactService) AddContact(ctx context.Context, userID uuid.UUID, newContact domain.NewContact) (domain.Contact, error) {
	// build & validate in one shot
	contact, err := domain.NewContactFrom(userID, newContact)
	if err != nil {
		return domain.Contact{}, DBError{Err: err}
	}

	return s.repo.Create(ctx, userID, contact)
}

func (s *ContactService) UpdateContact(ctx context.Context, userID, contactID uuid.UUID, newContact domain.NewContact) (domain.Contact, error) {
	// build & validate in one shot
	contact, err := domain.UpdatedContact(userID, contactID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	updated, err := s.repo.Update(ctx, userID, contactID, contact)
	if errors.Is(err, repository.ErrNotFound) {
		return domain.Contact{}, NotFoundError{"contact", contactID.String()}
	}
	if err != nil {
		return domain.Contact{}, DBError{Err: err}
	}
	return updated, nil

}

// func (s *ContactService) RemoveContact(ctx context.Context, userID, contactID string) error {
// 	return s.repo.Delete(ctx, userID, userID)
// }

func (s *ContactService) ListContacts(ctx context.Context, userID uuid.UUID) ([]domain.Contact, error) {
	return s.repo.ListByUser(ctx, userID)
}
