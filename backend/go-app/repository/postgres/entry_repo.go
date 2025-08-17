package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
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

// Create satisfies EntryRepository
func (r *PostgresEntryRepo) Create(
	ctx context.Context,
	e domain.Entry,
) (domain.Entry, error) {

	// 1) run INSERT … RETURNING
	const q = `
    INSERT INTO entries (id, user_id, contact_id, date)
    VALUES ($1, $2, $3, $4, $5)
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
