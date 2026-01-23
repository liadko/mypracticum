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
	log.Printf("[EntryService.AddEntry] Creating entry for user %s, contactID: %s, date: %s", userID, newEntry.ContactID, newEntry.DateStr)

	// build & validate in one shot
	entry, err := domain.NewEntryFrom(userID, newEntry)
	if err != nil {
		log.Printf("[EntryService.AddEntry] Failed to create entry: %v", err)
		return domain.Entry{}, err
	}

	// send to the repo
	createdEntry, err := s.repo.Create(ctx, entry)

	if err != nil {
		log.Printf("[EntryService.AddEntry] Failed to persist entry: %v", err)
		return domain.Entry{}, DBError{Err: err}
	}

	log.Printf("[EntryService.AddEntry] Entry created: %s", createdEntry.ID)
	return createdEntry, nil
}

func (s *EntryService) RemoveEntry(ctx context.Context, entryID, userID uuid.UUID) error {
	log.Printf("[EntryService.RemoveEntry] Removing entry %s for user %s", entryID, userID)
	if entryID == uuid.Nil {
		log.Printf("[EntryService.RemoveEntry] Invalid entry ID")
		return fmt.Errorf("invalid entry id")
	}
	if userID == uuid.Nil {
		log.Printf("[EntryService.RemoveEntry] Missing user ID")
		return fmt.Errorf("missing user")
	}

	err := s.repo.DeleteIfNotApproved(ctx, entryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[EntryService.RemoveEntry] Entry not found: %s", entryID)
			// tell handler to return 404
			return NotFoundError{"entry", entryID.String()}
		}
		if errors.Is(err, repository.ErrAlreadyApproved) {
			log.Printf("[EntryService.RemoveEntry] Cannot remove approved entry: %s", entryID)
			// tell handler to return 400
			return ValidationError("cannot remove an approved entry")
		}
		log.Printf("[EntryService.RemoveEntry] Failed to delete entry: %v", err)
		// wrap real DB errors into 500
		return DBError{Err: err}
	}

	log.Printf("[EntryService.RemoveEntry] Successfully removed entry %s", entryID)
	return nil
}

func (s *EntryService) ListStudentEntries(ctx context.Context, studentUserID uuid.UUID) ([]domain.Entry, error) {
	log.Printf("[EntryService.ListStudentEntries] Listing entries for student %s", studentUserID)
	list, err := s.repo.ListByStudent(ctx, studentUserID)
	if err != nil {
		log.Printf("[EntryService.ListStudentEntries] Failed to list entries: %v", err)
		return nil, DBError{Err: err}
	}
	log.Printf("[EntryService.ListStudentEntries] Retrieved %d entries", len(list))
	return list, nil
}

func (s *EntryService) ListMentorEntries(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Entry, error) {
	log.Printf("[EntryService.ListMentorEntries] Listing entries for mentor %s", mentorUserID)
	list, err := s.repo.ListByMentor(ctx, mentorUserID)
	if err != nil {
		log.Printf("[EntryService.ListMentorEntries] Failed to list entries: %v", err)
		return nil, DBError{Err: err}
	}
	log.Printf("[EntryService.ListMentorEntries] Retrieved %d entries", len(list))
	return list, nil
}

func (s *EntryService) SetApproval(
	ctx context.Context,
	mentorID uuid.UUID,
	entryID uuid.UUID,
	approved bool,
) (domain.Entry, error) {
	log.Printf("[EntryService.SetApproval] Setting approval=%t for entry %s by mentor %s", approved, entryID, mentorID)

	// fetch entry + its mentor link
	linked, err := s.repo.IsEntryLinkedToMentor(ctx, entryID, mentorID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[EntryService.SetApproval] Entry not found: %s", entryID)
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		log.Printf("[EntryService.SetApproval] Failed to check mentor link: %v", err)
		return domain.Entry{}, DBError{Err: err}
	}
	if !linked {
		log.Printf("[EntryService.SetApproval] Mentor %s not linked to entry %s", mentorID, entryID)
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
			log.Printf("[EntryService.SetApproval] Entry not found during update: %s", entryID)
			return domain.Entry{}, NotFoundError{"entry", entryID.String()}
		}
		log.Printf("[EntryService.SetApproval] Failed to update approval: %v", err)
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
	log.Printf("[EntryService.AddManualEntry] Adding manual entry for user %s, hours: %d, cause: %s", newEntry.UserID, newEntry.Hours, newEntry.Cause)

	// 1) Business logic validation
	if strings.TrimSpace(newEntry.Cause) == "" {
		log.Printf("[EntryService.AddManualEntry] Validation error: cause cannot be empty")
		return domain.ManualEntry{},
			ValidationError("cause cannot be empty")
	}
	if newEntry.Hours == 0 {
		log.Printf("[EntryService.AddManualEntry] Validation error: hours cannot be zero")
		return domain.ManualEntry{},
			ValidationError("hours cannot be zero")
	}

	// 2) Persist
	entry, err := s.repo.CreateManualEntry(ctx, newEntry)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			log.Printf("[EntryService.AddManualEntry] User not found: %s", newEntry.UserID)
			// This error comes from the repo if the user_id FK fails
			return domain.ManualEntry{},
				NotFoundError{"user", newEntry.UserID.String()}
		}
		log.Printf("[EntryService.AddManualEntry] Failed to persist entry: %v", err)
		return domain.ManualEntry{}, DBError{Err: err}
	}

	log.Printf("[EntryService.AddManualEntry] Manual entry created: %s", entry.ID)
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

	batchID := uuid.New()

	result := domain.BulkAddManualEntriesResult{
		Failures: []domain.FailedManualEntry{}, // Ensure slice is not nil
		BatchID:  &batchID,
	}

	for _, entry := range entries {

		entry.BatchID = &batchID // assign this batch's ID to each entry
		_, err := s.AddManualEntry(ctx, entry)

		if err != nil {
			// This entry failed, record it and continue
			result.FailedCount++
			// Log at debug level
			log.Printf("[EntryService.BulkAddManualEntries] admin=%s entry=%+v err=%v", adminID, entry, err)
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
		"[EntryService.BulkAddManualEntries] admin=%s processed %d entries: %d created, %d failed. batchID=%s",
		adminID,
		len(entries),
		result.CreatedCount,
		result.FailedCount,
		batchID.String(),
	)

	// A partial success is still a "success" from the handler's
	// perspective. We return the result and no error.
	return result, nil
}

// ListManualEntries retrieves all manual entries for a specific user.
//
// Returns:
//   - A slice of domain.ManualEntry (empty if none)
//   - A DBError for any underlying database failure.
func (s *EntryService) ListManualEntries(
	ctx context.Context,
	userID uuid.UUID,
) ([]domain.ManualEntry, error) {
	log.Printf("[EntryService.ListManualEntries] Listing manual entries for user %s", userID)

	entries, err := s.repo.ListManualEntriesByUserID(ctx, userID)
	if err != nil {
		log.Printf("[EntryService.ListManualEntries] Failed to list entries: %v", err)
		// No need to check for ErrNotFound, an empty slice is a valid response
		return nil, DBError{Err: err}
	}

	log.Printf("[EntryService.ListManualEntries] Retrieved %d manual entries", len(entries))
	return entries, nil
}

// DeleteManualEntriesByIDs passes a list of UUIDs to the repository
// to be deleted. The repository will delete all entries where
// EITHER the 'id' OR the 'batch_id' matches any UUID in the list.
func (s *EntryService) DeleteManualEntriesByIDs(
	ctx context.Context,
	ids []uuid.UUID,
) (domain.DeleteManualEntriesResult, error) {
	log.Printf("[EntryService.DeleteManualEntriesByIDs] Deleting %d manual entries", len(ids))

	entriesDeleted, batchesDeleted, err := s.repo.DeleteManualEntriesByIDs(ctx, ids)
	if err != nil {
		log.Printf("[EntryService.DeleteManualEntriesByIDs] Failed to delete entries: %v", err)
		return domain.DeleteManualEntriesResult{}, DBError{Err: err}
	}

	log.Printf("[EntryService.DeleteManualEntriesByIDs] Deleted %d entries, %d batches", entriesDeleted, batchesDeleted)
	return domain.DeleteManualEntriesResult{
		EntriesDeleted: entriesDeleted,
		BatchesDeleted: batchesDeleted,
	}, nil
}
