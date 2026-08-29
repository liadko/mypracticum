package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"
)

// PostgresEntryRepo “implements” EntryRepository
type PostgresEntryRepo struct {
	db *sql.DB
}

// Constructor returns the interface, not the concrete type
func NewPostgresEntryRepo(db *sql.DB) repository.EntryRepo {
	return &PostgresEntryRepo{db: db}
}

// ListByStudent satisfies EntryRepository
func (r *PostgresEntryRepo) ListByStudent(ctx context.Context, userID uuid.UUID) ([]domain.Entry, error) {
	entriesQuery := `
			SELECT id, contact_id, date, approver_id
			FROM entries 
			WHERE user_id = $1
			ORDER BY date DESC
		`
	rows, err := r.db.QueryContext(ctx, entriesQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("list entries for user %q: %w", userID, err)
	}
	defer rows.Close()

	entries := []domain.Entry{}
	for rows.Next() {
		var entry domain.Entry

		var approverID uuid.UUID
		var date sql.NullTime
		if err := rows.Scan(&entry.ID, &entry.ContactID, &date, &approverID); err != nil {
			fmt.Printf("Error scanning client entry row: %v", err)
			continue // Skip bad rows and continue
		}

		if date.Valid {
			entry.Date = date.Time
		} else {
			fmt.Println("Error parsing Date from entry")
		}

		entry.Approved = approverID != uuid.Nil

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row error while listing entries for user %q: %w", userID, err)
	}

	return entries, nil
}

func (r *PostgresEntryRepo) ListByMentor(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Entry, error) {
	const q = `
		SELECT e.id, e.user_id, e.contact_id, e.date, e.approver_id
		  FROM entries e
		  JOIN contacts c ON c.id = e.contact_id
		 WHERE c.type = 'mentor'
		   AND c.mentor_user_id = $1
		 ORDER BY e.date DESC
	`
	rows, err := r.db.QueryContext(ctx, q, mentorUserID)
	if err != nil {
		return nil, fmt.Errorf("list entries for mentor %q: %w", mentorUserID, err)
	}
	defer rows.Close()

	var out []domain.Entry
	for rows.Next() {
		var e domain.Entry
		var approverID uuid.UUID
		if err := rows.Scan(&e.ID, &e.UserID, &e.ContactID, &e.Date, &approverID); err != nil {
			log.Printf("scan mentor entry: %v", err)
			continue
		}
		e.Approved = approverID != uuid.Nil
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

// FindClassStartDateForEntry resolves the cutoff for a contact owned by the
// authenticated user. A classless user, or a class with no cutoff for this
// contact type, has no restriction.
func (r *PostgresEntryRepo) FindClassStartDateForEntry(
	ctx context.Context,
	userID, contactID uuid.UUID,
) (*time.Time, error) {
	const q = `
		SELECT CASE c.type
		         WHEN 'client' THEN cl.client_start_date
		         WHEN 'mentor' THEN cl.mentor_start_date
		         WHEN 'therapist' THEN cl.therapist_start_date
		       END
		  FROM contacts c
		  JOIN users u ON u.id = c.user_id
		  LEFT JOIN classes cl ON cl.id = u.class_id
		 WHERE c.id = $1
		   AND c.user_id = $2
	`

	var cutoff sql.NullTime
	if err := r.db.QueryRowContext(ctx, q, contactID, userID).Scan(&cutoff); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("find class start date for contact %s: %w", contactID, err)
	}
	if !cutoff.Valid {
		return nil, nil
	}
	return &cutoff.Time, nil
}

// Create satisfies EntryRepository
func (r *PostgresEntryRepo) Create(
	ctx context.Context,
	e domain.Entry,
) (domain.Entry, error) {

	// 1) run INSERT … RETURNING
	const q = `
    INSERT INTO entries (id, user_id, contact_id, date)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, contact_id, date
    `
	row := r.db.QueryRowContext(ctx, q,
		e.ID,
		e.UserID,
		e.ContactID,
		e.Date,
	)

	// 2) scan the returned row
	var out domain.Entry
	if err := row.Scan(
		&out.ID,
		&out.UserID,
		&out.ContactID,
		&out.Date,
	); err != nil {
		return domain.Entry{}, fmt.Errorf("insert entry: %w", err)
	}

	return out, nil
}

// DeleteIfNotApproved satisfies EntryRepository
func (r *PostgresEntryRepo) DeleteIfNotApproved(ctx context.Context, entryID, userID uuid.UUID) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1) lock row & check status
	const sel = `SELECT approver_id FROM entries WHERE id = $1 AND user_id = $2 FOR UPDATE`
	var approverID uuid.UUID
	if err := tx.QueryRowContext(ctx, sel, entryID, userID).Scan(&approverID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return repository.ErrNotFound
		}
		return fmt.Errorf("check status: %w", err)
	}

	if approverID != uuid.Nil {
		return repository.ErrAlreadyApproved
	}

	// 2) delete if not approved
	const del = `DELETE FROM entries WHERE id = $1 AND user_id = $2`
	res, err := tx.ExecContext(ctx, del, entryID, userID)
	if err != nil {
		return fmt.Errorf("delete entry: %w", err)
	}

	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		return repository.ErrNotFound
	}

	// 3) commit
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

// UpdateApproval sets approver_id (mentor) or NULL and returns the updated entry.
func (r *PostgresEntryRepo) UpdateApproval(
	ctx context.Context,
	entryID uuid.UUID,
	approverID *uuid.UUID,
) (domain.Entry, error) {
	const q = `
		UPDATE entries
		   SET approver_id = $2
		 WHERE id = $1
		 RETURNING id, user_id, contact_id, date, approver_id
	`

	// pass NULL when approverID == nil
	var param interface{}
	if approverID == nil {
		param = nil
	} else {
		param = *approverID
	}

	var out domain.Entry
	var approver uuid.UUID
	err := r.db.QueryRowContext(ctx, q, entryID, param).
		Scan(&out.ID, &out.UserID, &out.ContactID, &out.Date, &approver)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.Entry{}, repository.ErrNotFound
		}
		return domain.Entry{}, err
	}
	out.Approved = approver != uuid.Nil
	return out, nil
}

func (r *PostgresEntryRepo) IsEntryLinkedToMentor(
	ctx context.Context,
	entryID, mentorUserID uuid.UUID,
) (bool, error) {
	const q = `
		SELECT COALESCE(c.mentor_user_id = $2, false) AS linked
		  FROM entries e
		  JOIN contacts c ON c.id = e.contact_id
		 WHERE e.id = $1
	`
	var linked bool
	err := r.db.QueryRowContext(ctx, q, entryID, mentorUserID).Scan(&linked)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, repository.ErrNotFound
		}
		return false, err
	}
	return linked, nil
}

// CreateManualEntry inserts a new row into the manual_entries table.
//
// Returns:
//   - the created domain.ManualEntry (with ID, CreatedAt populated)
//
// Errors:
//   - repository.ErrNotFound if the user_id does not exist in the users table.
//   - any other SQL error.
func (r *PostgresEntryRepo) CreateManualEntry(
	ctx context.Context,
	entry domain.NewManualEntry,
) (domain.ManualEntry, error) {

	const q = `
    INSERT INTO manual_entries (user_id, hours, cause, type, batch_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, hours, cause, type, batch_id, created_at
    `

	var createdEntry domain.ManualEntry
	err := r.db.QueryRowContext(
		ctx,
		q,
		entry.UserID,
		entry.Hours,
		entry.Cause,
		entry.Type,
		entry.BatchID,
	).Scan(
		&createdEntry.ID,
		&createdEntry.UserID,
		&createdEntry.Hours,
		&createdEntry.Cause,
		&createdEntry.Type,
		&createdEntry.BatchID,
		&createdEntry.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		// Check for foreign key violation (e.g., user_id doesn't exist)
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.ManualEntry{}, repository.ErrNotFound
		}
		return domain.ManualEntry{}, err
	}

	return createdEntry, nil
}

// ListManualEntriesByUserID fetches all manual entries for a specific user,
// ordered by most recent first.
func (r *PostgresEntryRepo) ListManualEntriesByUserID(
	ctx context.Context,
	userID uuid.UUID,
) ([]domain.ManualEntry, error) {

	const q = `
    SELECT id, user_id, hours, cause, type, created_at
    FROM manual_entries
    WHERE user_id = $1
    ORDER BY created_at DESC
    `

	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []domain.ManualEntry
	for rows.Next() {
		var e domain.ManualEntry
		if err := rows.Scan(
			&e.ID,
			&e.UserID,
			&e.Hours,
			&e.Cause,
			&e.Type,
			&e.CreatedAt,
		); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// Return the (possibly empty) slice
	return entries, nil
}

// DeleteManualEntriesByIDs deletes all manual entries where the 'id'
// or the 'batch_id' matches any of the provided UUIDs.
// It runs in a transaction and returns the counts for each deletion type.
func (r *PostgresEntryRepo) DeleteManualEntriesByIDs(
	ctx context.Context,
	ids []uuid.UUID,
) (int64, int64, error) {

	// Start a new transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	// Defer a rollback in case anything goes wrong
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback() // Rollback on panic
			panic(p)
		} else if err != nil {
			_ = tx.Rollback() // Rollback on error
		}
	}()

	var entriesDeleted, batchesDeleted int64

	// 1. Delete by BATCH_ID
	// We delete by batch_id first.
	const deleteBatchQuery = `DELETE FROM manual_entries WHERE batch_id = ANY($1)`
	res, err := tx.ExecContext(ctx, deleteBatchQuery, pq.Array(ids))
	if err != nil {
		return 0, 0, fmt.Errorf("failed to delete by batch_id: %w", err)
	}
	batchesDeleted, _ = res.RowsAffected()

	// 2. Delete by ID
	// This will catch any individual entry IDs. If an ID was *also* a
	// batch_id, its rows were already deleted, so this won't affect them.
	const deleteEntryQuery = `DELETE FROM manual_entries WHERE id = ANY($1)`
	res, err = tx.ExecContext(ctx, deleteEntryQuery, pq.Array(ids))
	if err != nil {
		return 0, 0, fmt.Errorf("failed to delete by entry id: %w", err)
	}
	entriesDeleted, _ = res.RowsAffected()

	// 3. Commit the transaction
	if err = tx.Commit(); err != nil {
		return 0, 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return entriesDeleted, batchesDeleted, nil
}

// DeleteEntriesByIDs deletes entries by their IDs regardless of approval status.
func (r *PostgresEntryRepo) DeleteEntriesByIDs(ctx context.Context, ids []uuid.UUID) (int64, error) {
	// Note: If you are using the 'github.com/lib/pq' driver instead of pgx,
	// you must wrap 'ids' using pq.Array(ids) for Postgres slice binding to work.
	const query = `DELETE FROM entries WHERE id = ANY($1)`

	res, err := r.db.ExecContext(ctx, query, ids)
	if err != nil {
		return 0, fmt.Errorf("delete entries by ids: %w", err)
	}

	deleted, err := res.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("rows affected: %w", err)
	}

	return deleted, nil
}
