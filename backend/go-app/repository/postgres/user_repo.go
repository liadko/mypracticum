package postgres

import (
	"context"
	"database/sql"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

type PostgresUserRepo struct {
	db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) repository.UserRepo {
	return &PostgresUserRepo{db: db}
}

const baseUserQuery = `
SELECT id
     , first_name
     , last_name
     , email
     , signature
     , created_at
  FROM users
`

// loadUser runs the given WHERE clause (with one placeholder $1), scans
// the core user fields, then loads and attaches roles.
func (r *PostgresUserRepo) loadUser(
	ctx context.Context,
	where string,
	arg interface{},
) (domain.User, error) {
	// 1) fetch the main row
	q := baseUserQuery + " WHERE " + where
	var u domain.User
	if err := r.db.
		QueryRowContext(ctx, q, arg).
		Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Signature, &u.CreatedAt); err != nil {

		if err == sql.ErrNoRows {
			return domain.User{}, repository.ErrNotFound
		}
		return domain.User{}, err
	}

	// 2) fetch & attach roles
	roles, err := r.fetchRoles(ctx, u.ID)
	if err != nil {
		return domain.User{}, err
	}
	u.Roles = roles
	return u, nil
}

func (r *PostgresUserRepo) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	// “email = $1” is our only variable bit
	return r.loadUser(ctx, "email = $1", email)
}

func (r *PostgresUserRepo) FindByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	return r.loadUser(ctx, "id = $1", id)
}

// fetchRoles returns all roles assigned to a given user.
func (r *PostgresUserRepo) fetchRoles(ctx context.Context, userID uuid.UUID) ([]domain.Role, error) {
	const q = `
    SELECT r.id, r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
    `
	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		var ro domain.Role
		if err := rows.Scan(&ro.ID, &ro.Name); err != nil {
			return nil, err
		}
		roles = append(roles, ro)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return roles, nil
}

// UpdateSignature writes the raw SVG bytes into the users.signature column.
func (r *PostgresUserRepo) UpdateSignature(
	ctx context.Context,
	userID uuid.UUID,
	sig []byte,
) ([]byte, error) {
	const q = `
    UPDATE users
       SET signature = $1
     WHERE id = $2
    RETURNING signature
    `
	var storedSig []byte
	err := r.db.
		QueryRowContext(ctx, q, sig, userID).
		Scan(&storedSig)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, repository.ErrNotFound
		}
		return nil, err
	}
	return storedSig, nil
}
