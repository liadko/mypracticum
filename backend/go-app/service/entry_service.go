package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
	"strings"

	"github.com/google/uuid"
)

type EntryService struct {
	repo repository.EntryRepo
}

func NewEntryService(repo repository.EntryRepo) *EntryService {
	return &EntryService{repo: repo}
}

func (s *EntryService) AddEntry(
	ctx context.Context,
	userID uuid.UUID,
	newEntry domain.NewEntry, // or just (contactID, dateStr string)
) (domain.Entry, error) {

	// build & validate in one shot
	entry, err := domain.NewEntryFrom(userID, newEntry)
	if err != nil {
		return domain.Entry{}, err
	}

	// send to the repo
	createdEntry, err := s.repo.Create(ctx, entry)

	if err != nil {
		return domain.Entry{}, DBError{Err: err}
	}

	return createdEntry, nil
}

func (s *EntryService) RemoveEntry(ctx context.Context, entryID, userID uuid.UUID) error {
	if entryID == uuid.Nil {
		return fmt.Errorf("invalid entry id")
	}
	if userID == uuid.Nil {
		return fmt.Errorf("missing user")
	}

	err := s.repo.DeleteIfNotApproved(ctx, entryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// tell handler to return 404
			return NotFoundError{"entry", entryID.String()}
		}
		if errors.Is(err, repository.ErrAlreadyApproved) {
			// tell handler to return 400
			return ValidationError("cannot remove an approved entry")
		}
		// wrap real DB errors into 500
		return DBError{Err: err}
	}

	return nil
}

func (s *EntryService) ListStudentEntries(ctx context.Context, studentUserID uuid.UUID) ([]domain.Entry, error) {
	list, err := s.repo.ListByStudent(ctx, studentUserID)
	if err != nil {
		return nil, DBError{Err: err}
	}
	return list, nil
}

func (s *EntryService) ListMentorEntries(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Entry, error) {
	list, err := s.repo.ListByMentor(ctx, mentorUserID)
	if err != nil {
		return nil, DBError{Err: err}
	}
	return list, nil
}

func (s *EntryService) SetApproval(
	ctx context.Context,
	mentorID uuid.UUID,
	entryID uuid.UUID,
	approved bool,
) (domain.Entry, error) {

	// fetch entry + its mentor link
	linked, err := s.repo.IsEntryLinkedToMentor(ctx, entryID, mentorID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		return domain.Entry{}, DBError{Err: err}
	}
	if !linked {
		return domain.Entry{}, ForbiddenError{"not mentor of this entry"}
	}

	// set approver_id := mentorID (approved) or NULL (unapprove)
	var approver *uuid.UUID
	if approved {
		approver = &mentorID
	}

	updated, err := s.repo.UpdateApproval(ctx, entryID, approver)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		return domain.Entry{}, DBError{Err: err}
	}
	return updated, nil
}

type BulkApprovalResult struct {
	Total     int             `json:"total"`
	Succeeded int             `json:"succeeded"`
	NotFound  []string        `json:"notFound,omitempty"`
	Errors    []EntryRowError `json:"errors,omitempty"`
}

func (s *EntryService) BulkSetApproval(
	ctx context.Context,
	actor uuid.UUID,
	ids []uuid.UUID,
	approved bool,
) (BulkApprovalResult, error) {

	res := BulkApprovalResult{Total: len(ids)}
	log.Printf("[ENTRY][BulkSetApproval] actor=%s approved=%t total=%d", actor, approved, len(ids))

	var approver *uuid.UUID
	if approved {
		approver = &actor
	} // unapprove → nil

	for i, id := range ids {
		_, err := s.repo.UpdateApproval(ctx, id, approver)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				res.NotFound = append(res.NotFound, id.String())
				continue
			}
			log.Printf("[ENTRY][BulkSetApproval] idx=%d id=%s err=%v", i, id, err)
			res.Errors = append(res.Errors, EntryRowError{ID: id, Err: err.Error()})
			continue
		}
		res.Succeeded++
	}

	log.Printf("[ENTRY][BulkSetApproval] done succeeded=%d notFound=%d errors=%d",
		res.Succeeded, len(res.NotFound), len(res.Errors))
	return res, nil
}

// AddManualEntry validates and inserts a new manual entry for a user.
// This is for administrative adjustments (e.g., granting hours for a
// special case) that fall outside the standard entry logging.
//
// Returns:
//   - the created domain.ManualEntry
//
// Errors:
//   - ValidationError if the cause is empty or hours are zero.
//   - NotFoundError   if the user specified by newEntry.UserID does not exist.
//   - DBError         for any underlying database failure.
func (s *EntryService) AddManualEntry(
	ctx context.Context,
	newEntry domain.NewManualEntry,
) (domain.ManualEntry, error) {

	// 1) Business logic validation
	if strings.TrimSpace(newEntry.Cause) == "" {
		return domain.ManualEntry{},
			ValidationError("cause cannot be empty")
	}
	if newEntry.Hours == 0 {
		return domain.ManualEntry{},
			ValidationError("hours cannot be zero")
	}

	// 2) Persist
	entry, err := s.repo.CreateManualEntry(ctx, newEntry)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// This error comes from the repo if the user_id FK fails
			return domain.ManualEntry{},
				NotFoundError{"user", newEntry.UserID.String()}
		}
		return domain.ManualEntry{}, DBError{Err: err}
	}

	return entry, nil
}

// BulkAddManualEntries attempts to create multiple manual entries in a single
// operation. It does NOT run in a transaction, meaning some entries may
// succeed while others fail.
//
// A summary of successful and failed operations is always returned,
// and 'error' is only returned for a total, unrecoverable failure.
func (s *EntryService) BulkAddManualEntries(
	ctx context.Context,
	adminID uuid.UUID, // for logging
	entries []domain.NewManualEntry,
) (domain.BulkAddManualEntriesResult, error) {

	result := domain.BulkAddManualEntriesResult{
		Failures: []domain.FailedManualEntry{}, // Ensure slice is not nil
	}

	for _, entry := range entries {
		// We re-use the singular AddManualEntry method to ensure all
		// validation and repository logic is applied consistently.
		_, err := s.AddManualEntry(ctx, entry)

		if err != nil {
			// This entry failed, record it and continue
			result.FailedCount++
			result.Failures = append(result.Failures, domain.FailedManualEntry{
				Input: entry,
				Error: err.Error(),
			})
		} else {
			// This entry succeeded
			result.CreatedCount++
		}
	}

	log.Printf(
		"[SERVICE][BulkAddManual] admin=%s processed %d entries: %d created, %d failed",
		adminID,
		len(entries),
		result.CreatedCount,
		result.FailedCount,
	)

	// A partial success is still a "success" from the handler's
	// perspective. We return the result and no error.
	return result, nil
}
