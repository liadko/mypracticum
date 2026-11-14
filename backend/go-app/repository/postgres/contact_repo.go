package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

// PostgresContactRepo “implements” ContactRepository
type PostgresContactRepo struct {
	db *sql.DB
}

// Constructor returns the interface, not the concrete type
func NewPostgresContactRepo(db *sql.DB) repository.ContactRepo {
	return &PostgresContactRepo{db: db}
}

// Create implements repository.ContactRepository.
func (r *PostgresContactRepo) Create(ctx context.Context, userID uuid.UUID, c domain.Contact) (domain.Contact, error) {
	metadata, err := encodeContactMetadata(c)
	if err != nil {
		return domain.Contact{}, err
	}

	query := `
		INSERT INTO contacts (id, user_id, type, name, mentor_user_id, metadata)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb)
		RETURNING ` + contactColumns

	row := r.db.QueryRowContext(ctx, query, c.ID, c.UserID, c.Type, c.Name, c.MentorUserID, metadata)

	out, err := scanContact(row)
	if err != nil {
		return domain.Contact{}, fmt.Errorf("creating contact: %w", err)
	}

	return out, nil
}

// Update implements repository.ContactRepository
func (r *PostgresContactRepo) Update(
	ctx context.Context,
	userID uuid.UUID,
	contactID uuid.UUID,
	c domain.Contact,
) (domain.Contact, error) {
	metadata, err := encodeContactMetadata(c)
	if err != nil {
		return domain.Contact{}, err
	}

	q := `
		UPDATE contacts
		   SET type           = $1,
		       name           = $2,
		       mentor_user_id = $3,
		       metadata       = $4::jsonb
		 WHERE user_id = $5
		   AND id      = $6
		RETURNING ` + contactColumns

	row := r.db.QueryRowContext(ctx, q, c.Type, c.Name, c.MentorUserID, metadata, userID, contactID)

	out, err := scanContact(row)
	if err != nil {
		if err == sql.ErrNoRows {
			// Caller tried to update a non-existent contact
			return domain.Contact{}, repository.ErrNotFound
		}
		// Some other DB error—bubble it up
		return domain.Contact{}, fmt.Errorf("updating contact %s: %w", contactID, err)
	}

	return out, nil
}

// ListByUser satisfies ContactRepository
func (r *PostgresContactRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Contact, error) {
	contactsQuery := `
        SELECT ` + contactColumns + `
          FROM contacts
         WHERE user_id = $1
      ORDER BY name
    `

	rows, err := r.db.QueryContext(ctx, contactsQuery, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []domain.Contact
	for rows.Next() {
		c, err := scanContact(rows)
		if err != nil {
			log.Printf("Error scanning contact row: %v", err)
			continue // skip bad row
		}
		contacts = append(contacts, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return contacts, nil
}

func (r *PostgresContactRepo) UserHasMentor(ctx context.Context, userID uuid.UUID, email string) (bool, error) {
	return r.UserHasMentorExcept(ctx, userID, email, uuid.Nil)
}

func (r *PostgresContactRepo) UserHasMentorExcept(
	ctx context.Context,
	userID uuid.UUID,
	email string,
	exceptContactID uuid.UUID,
) (bool, error) {
	const q = `
		SELECT 1
		  FROM contacts
		 WHERE user_id = $1
		   AND type = 'mentor'
		   AND metadata->>'email' = $2
		   AND id <> $3
		 LIMIT 1;
	`
	var dummy int
	err := r.db.QueryRowContext(ctx, q, userID, email, exceptContactID).Scan(&dummy)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *PostgresContactRepo) GetMentor(ctx context.Context, userID, contactID uuid.UUID) (domain.Contact, error) {
	q := `
		SELECT ` + contactColumns + `
		  FROM contacts
		 WHERE user_id = $1
		   AND id = $2
		   AND type = 'mentor'
	`
	c, err := scanContact(r.db.QueryRowContext(ctx, q, userID, contactID))
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.Contact{}, repository.ErrNotFound
		}
		return domain.Contact{}, fmt.Errorf("fetching mentor contact %s: %w", contactID, err)
	}
	return c, nil
}

// // Delete satisfies ContactRepository
// func (r *PostgresContactRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
// 	// DELETE FROM contacts WHERE id=$1 AND user_id=$2
// 	return fmt.Errorf("Delete Not Implemented Yet")
// }

// ---- private helpers ----

// contactMetadata is the shape of contacts.metadata, where every
// type-specific contact detail lives.
type contactMetadata struct {
	Email                    *string                       `json:"email,omitempty"`
	Phone                    *string                       `json:"phone,omitempty"`
	Specialty                *string                       `json:"specialty,omitempty"`
	ClientInstitution        *string                       `json:"clientInstitution,omitempty"`
	ClientTrainingCenterInfo *string                       `json:"clientTrainingCenterInfo,omitempty"`
	TrainingCenter           *domain.TrainingCenterDetails `json:"trainingCenter,omitempty"`
}

// encodeContactMetadata returns JSON as a string because database/sql would
// send a []byte as bytea, which Postgres won't cast to jsonb.
func encodeContactMetadata(c domain.Contact) (string, error) {
	encoded, err := json.Marshal(contactMetadata{
		Email:                    c.Email,
		Phone:                    c.Phone,
		Specialty:                c.Specialty,
		ClientInstitution:        c.ClientInstitution,
		ClientTrainingCenterInfo: c.ClientTrainingCenterInfo,
		TrainingCenter:           c.TrainingCenter,
	})
	if err != nil {
		return "", fmt.Errorf("encoding contact metadata: %w", err)
	}
	return string(encoded), nil
}

const contactColumns = `id, user_id, type, name, mentor_user_id, metadata`

type rowScanner interface {
	Scan(dest ...any) error
}

// scanContact reads a row selected with contactColumns.
func scanContact(row rowScanner) (domain.Contact, error) {
	var c domain.Contact
	var rawMetadata []byte
	if err := row.Scan(&c.ID, &c.UserID, &c.Type, &c.Name, &c.MentorUserID, &rawMetadata); err != nil {
		return domain.Contact{}, err
	}

	var metadata contactMetadata
	if err := json.Unmarshal(rawMetadata, &metadata); err != nil {
		return domain.Contact{}, fmt.Errorf("decoding metadata of contact %s: %w", c.ID, err)
	}
	c.Email = metadata.Email
	c.Phone = metadata.Phone
	c.Specialty = metadata.Specialty
	c.ClientInstitution = metadata.ClientInstitution
	c.ClientTrainingCenterInfo = metadata.ClientTrainingCenterInfo
	c.TrainingCenter = metadata.TrainingCenter
	return c, nil
}
