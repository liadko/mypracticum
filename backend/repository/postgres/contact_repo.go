package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
)

// PostgresContactRepo “implements” ContactRepository
type PostgresContactRepo struct {
	db *sql.DB
}

// Constructor returns the interface, not the concrete type
func NewPostgresContactRepo(db *sql.DB) repository.ContactRepository {
	return &PostgresContactRepo{db: db}
}

// ListByUser satisfies ContactRepository
func (r *PostgresContactRepo) ListByUser(ctx context.Context, userID string) ([]domain.Contact, error) {
	contactsQuery := `
        SELECT id, user_id, type, name, email, phone, specialty
			FROM contacts 
			WHERE user_id = $1
			ORDER BY name
		`
	rows, err := r.db.QueryContext(ctx, contactsQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("list contacts for user %q: %w", userID, err)
	}
	defer rows.Close()

	contacts := []domain.Contact{}
	for rows.Next() {
		var c domain.Contact
		var email, phone, specialty sql.NullString

		if err := rows.Scan(
			&c.ID,
			&c.UserID,
			&c.Type,
			&c.Name,
			&email,
			&phone,
			&specialty,
		); err != nil {
			log.Printf("Error scanning client contact row: %v", err)
			continue // Skip bad rows and continue
		}

		if email.Valid {
			c.Email = &email.String
		}
		if phone.Valid {
			c.Phone = &phone.String
		}
		if specialty.Valid {
			c.Specialty = &specialty.String
		}

		contacts = append(contacts, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return contacts, nil
}

// Create satisfies ContactRepository
func (r *PostgresContactRepo) Create(ctx context.Context, e domain.Contact) (domain.Contact, error) {
	// INSERT … RETURNING id,contact_id,date,approved
	return domain.Contact{}, fmt.Errorf("Create Not Implemented Yet")
}

// Delete satisfies ContactRepository
func (r *PostgresContactRepo) Delete(ctx context.Context, id, userID string) error {
	// DELETE FROM contacts WHERE id=$1 AND user_id=$2
	return fmt.Errorf("Delete Not Implemented Yet")
}
