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
	query := `
		INSERT INTO contacts (
			id, user_id, type, name,
			email, phone, specialty,
			mentor_user_id,
			mentorship_type, client_institution, client_training_center_info
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, user_id, type, name,
				email, phone, specialty,
				mentor_user_id,
				mentorship_type, client_institution, client_training_center_info`

	row := r.db.QueryRowContext(ctx, query, c.ID, c.UserID, c.Type, c.Name, c.Email, c.Phone, c.Specialty, c.MentorUserID, c.MentorshipType, c.ClientInstitution, c.ClientTrainingCenterInfo)

	var out domain.Contact
	if err := row.Scan(&out.ID, &out.UserID, &out.Type, &out.Name,
		&out.Email, &out.Phone, &out.Specialty,
		&out.MentorUserID,
		&out.MentorshipType, &out.ClientInstitution, &out.ClientTrainingCenterInfo); err != nil {
		return domain.Contact{}, fmt.Errorf("creating contact: %w", err)
	}

	return out, nil
}

// Update implements repository.ContactRepository.
func (r *PostgresContactRepo) Update(
	ctx context.Context,
	userID uuid.UUID,
	contactID uuid.UUID,
	c domain.Contact,
) (domain.Contact, error) {
	const q = `
		UPDATE contacts
			SET type                     = $1,
				name                     = $2,
				email                    = $3,
				phone                    = $4,
				specialty                = $5,
				mentor_user_id           = $6,
				mentorship_type          = $7,
				client_institution       = $8,
				client_training_center_info = $9
		WHERE user_id = $10
			AND id      = $11
		RETURNING id, user_id, type, name,
				email, phone, specialty,
				mentor_user_id,
				mentorship_type, client_institution, client_training_center_info
	`
	row := r.db.QueryRowContext(ctx, q,
		c.Type,
		c.Name,
		c.Email,
		c.Phone,
		c.Specialty,
		c.MentorUserID,
		c.MentorshipType,
		c.ClientInstitution,
		c.ClientTrainingCenterInfo,
		userID,
		contactID,
	)

	var out domain.Contact
	if err := row.Scan(
		&out.ID,
		&out.UserID,
		&out.Type,
		&out.Name,
		&out.Email,
		&out.Phone,
		&out.Specialty,
		&out.MentorUserID,
		&out.MentorshipType,
		&out.ClientInstitution,
		&out.ClientTrainingCenterInfo,
	); err != nil {
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
	const contactsQuery = `
        SELECT id, user_id, type, name,
               email, phone, specialty,
               mentor_user_id,
               mentorship_type, client_institution, client_training_center_info
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
		var c domain.Contact
		if err := rows.Scan(
			&c.ID,
			&c.UserID,
			&c.Type,
			&c.Name,
			&c.Email,
			&c.Phone,
			&c.Specialty,
			&c.MentorUserID,
			&c.MentorshipType,
			&c.ClientInstitution,
			&c.ClientTrainingCenterInfo,
		); err != nil {
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

func (r *PostgresContactRepo) UserHasMentor(ctx context.Context, userID uuid.UUID, email string, mentorshipType string) (bool, error) {
	return r.UserHasMentorExcept(ctx, userID, email, mentorshipType, uuid.Nil)
}

func (r *PostgresContactRepo) UserHasMentorExcept(
	ctx context.Context,
	userID uuid.UUID,
	email string,
	mentorshipType string,
	exceptContactID uuid.UUID,
) (bool, error) {
	const q = `
		SELECT 1
			FROM contacts
		WHERE user_id			= $1
			AND type			= 'mentor'
			AND email   		= $2
			AND mentorship_type	= $3
			AND id  		   <> $4
		LIMIT 1;
	`
	var dummy int
	err := r.db.QueryRowContext(ctx, q, userID, email, mentorshipType, exceptContactID).Scan(&dummy)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// // Delete satisfies ContactRepository
// func (r *PostgresContactRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
// 	// DELETE FROM contacts WHERE id=$1 AND user_id=$2
// 	return fmt.Errorf("Delete Not Implemented Yet")
// }
