package postgres

import (
	"context"
	"database/sql"
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

// ListByUser satisfies EntryRepository
func (r *PostgresEntryRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Entry, error) {
	entriesQuery := `
			SELECT id, contact_id, date, approved  
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

		if err := rows.Scan(&entry.ID, &entry.ContactID, &entry.Date, &entry.Approved); err != nil {
			log.Printf("Error scanning client entry row: %v", err)
			continue // Skip bad rows and continue
		}

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

// Create satisfies EntryRepository
func (r *PostgresEntryRepo) Create(
	ctx context.Context,
	e domain.Entry,
) (domain.Entry, error) {

	// 1) run INSERT … RETURNING
	const q = `
    INSERT INTO entries (id, user_id, contact_id, date, approved)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, contact_id, date, approved
    `
	row := r.db.QueryRowContext(ctx, q,
		e.ID,
		e.UserID,
		e.ContactID,
		e.Date,
		e.Approved,
	)

	// 2) scan the returned row
	var out domain.Entry
	if err := row.Scan(
		&out.ID,
		&out.UserID,
		&out.ContactID,
		&out.Date,
		&out.Approved,
	); err != nil {
		return domain.Entry{}, fmt.Errorf("insert entry: %w", err)
	}

	return out, nil
}

// Delete satisfies EntryRepository
func (r *PostgresEntryRepo) Delete(ctx context.Context, entryID, userID uuid.UUID) error {

	const q = `
    DELETE FROM entries
    WHERE id = $1 AND user_id = $2
    `
	res, err := r.db.ExecContext(ctx, q, entryID, userID)
	if err != nil {
		return fmt.Errorf("delete entry: %w", err)
	}

	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete entry (rows affected): %w", err)
	}
	if n == 0 {
		return repository.ErrNotFound
	}
	return nil
}
