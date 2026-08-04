package repository

import (
	"context"

	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// ReportRepo contains read-only queries designed for the analyst dashboard.
// It deliberately does not expose arbitrary SQL to callers.
type ReportRepo interface {
	SearchStudentSummaries(ctx context.Context, query, classFilter, sortBy, sortDirection string, limit, offset int) ([]domain.StudentSummary, int64, error)
	ListStudentClasses(ctx context.Context) ([]string, error)
	SearchMentorSummaries(ctx context.Context, query, sortBy, sortDirection string, limit, offset int) ([]domain.MentorSummary, int64, error)
	ListMentorStudents(ctx context.Context, mentorID uuid.UUID) ([]domain.MentorStudent, error)
	ListMentorEvents(ctx context.Context, mentorID uuid.UUID) ([]domain.MentorEvent, error)
	ListStudentEvents(ctx context.Context, studentID uuid.UUID) ([]domain.ReportEvent, error)
	ListStudentManualEntries(ctx context.Context, studentID uuid.UUID) ([]domain.ReportManualEntry, error)
}
