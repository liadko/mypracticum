package repository

import (
	"context"
	"mypracticum/backend/domain"
	"time"

	"github.com/google/uuid"
)

// EntryRepo defines how the service reads/writes entries.
type EntryRepo interface {
	ListByStudent(ctx context.Context, userID uuid.UUID) ([]domain.Entry, error)
	ListByMentor(ctx context.Context, userID uuid.UUID) ([]domain.Entry, error)
	// FindClassStartDateForEntry returns the authenticated user's class cutoff
	// for the contact, or nil when the user/contact has no applicable cutoff.
	FindClassStartDateForEntry(ctx context.Context, userID, contactID uuid.UUID) (*time.Time, error)

	Create(ctx context.Context, e domain.Entry) (domain.Entry, error)
	DeleteIfNotApproved(ctx context.Context, id, userID uuid.UUID) error
	UpdateApproval(ctx context.Context, entryID uuid.UUID, approverID *uuid.UUID) (domain.Entry, error)
	IsEntryLinkedToMentor(ctx context.Context, entryID, mentorUserID uuid.UUID) (bool, error)
	CreateManualEntry(ctx context.Context, entry domain.NewManualEntry) (domain.ManualEntry, error)
	ListManualEntriesByUserID(ctx context.Context, userID uuid.UUID) ([]domain.ManualEntry, error)

	DeleteManualEntriesByIDs(ctx context.Context, ids []uuid.UUID) (entriesDeleted int64, batchesDeleted int64, err error)
	DeleteEntriesByIDs(ctx context.Context, ids []uuid.UUID) (int64, error)
}
