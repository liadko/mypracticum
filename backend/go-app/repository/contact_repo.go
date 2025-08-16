package repository

import (
	"context"
	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// ContactRepo defines how the service reads/writes contacts.
type ContactRepo interface {
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Contact, error)
	Create(ctx context.Context, userID uuid.UUID, c domain.Contact) (domain.Contact, error)
	Update(ctx context.Context, userID, contactID uuid.UUID, c domain.Contact) (domain.Contact, error)

	ExistsByUserTypeEmail(ctx context.Context, userID uuid.UUID, ctype domain.ContactType, email string) (bool, error)
	//Delete(ctx context.Context, userID, contactID uuid.UUID) error
}
