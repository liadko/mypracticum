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
	UserHasMentorExcept(ctx context.Context, userID uuid.UUID, email string, mentorshipType string, exceptContactID uuid.UUID) (bool, error)
	UserHasMentor(ctx context.Context, userID uuid.UUID, email string, mentorshipType string) (bool, error)
	//Delete(ctx context.Context, userID, contactID uuid.UUID) error
}
