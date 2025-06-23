package repository

import (
	"context"
	"mypracticum/backend/domain"
)

// ContactRepository defines how the service reads/writes contacts.
type ContactRepository interface {
	ListByUser(ctx context.Context, userID string) ([]domain.Contact, error)
	Create(ctx context.Context, c domain.Contact) (domain.Contact, error)
	Delete(ctx context.Context, id, userID string) error
}
