package repository

import (
	"context"
	"mypracticum/backend/domain"
)

// EntryRepository defines how the service reads/writes entries.
type EntryRepository interface {
	ListByUser(ctx context.Context, userID string) ([]domain.Entry, error)
	Create(ctx context.Context, e domain.Entry) (domain.Entry, error)
	Delete(ctx context.Context, id, userID string) error
}
