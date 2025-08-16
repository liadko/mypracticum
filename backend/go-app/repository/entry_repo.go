package repository

import (
	"context"
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// EntryRepo defines how the service reads/writes entries.
type EntryRepo interface {
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Entry, error)
	Create(ctx context.Context, e domain.Entry) (domain.Entry, error)
	DeleteIfNotApproved(ctx context.Context, id, userID uuid.UUID) error
}
