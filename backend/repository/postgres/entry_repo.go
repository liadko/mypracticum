package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
)

// PostgresEntryRepo “implements” EntryRepository
type PostgresEntryRepo struct {
	db *sql.DB
}

// Constructor returns the interface, not the concrete type
func NewPostgresEntryRepo(db *sql.DB) repository.EntryRepository {
	return &PostgresEntryRepo{db: db}
}

// ListByUser satisfies EntryRepository
func (r *PostgresEntryRepo) ListByUser(ctx context.Context, userID string) ([]domain.Entry, error) {
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
		var dt time.Time // Scan directly into time.Time for correct handling

		if err := rows.Scan(&entry.ID, &entry.ContactID, &dt, &entry.Approved); err != nil {
			log.Printf("Error scanning client entry row: %v", err)
			continue // Skip bad rows and continue
		}

		// Format the date to the "YYYY-MM-DD" string your frontend expects
		entry.Date = dt.Format("2006-01-02")

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

// Create satisfies EntryRepository
func (r *PostgresEntryRepo) Create(ctx context.Context, e domain.Entry) (domain.Entry, error) {
	// INSERT … RETURNING id,contact_id,date,approved
	return domain.Entry{}, fmt.Errorf("Create Not Implemented Yet")
}

// Delete satisfies EntryRepository
func (r *PostgresEntryRepo) Delete(ctx context.Context, id, userID string) error {
	// DELETE FROM entries WHERE id=$1 AND user_id=$2
	return fmt.Errorf("Delete Not Implemented Yet")
}
