package repository

import (
	"context"
	"mypracticum/backend/domain"
)

// ContactRepository defines how the service reads/writes contacts.
type ContactRepository interface {
	ListByUser(ctx context.Context, userID string) ([]domain.Contact, error)
	Create(ctx context.Context, userID string, c domain.Contact) (domain.Contact, error)
	Update(ctx context.Context, userID, id string, c domain.Contact) (domain.Contact, error)
	Delete(ctx context.Context, userID, id string) error
}
