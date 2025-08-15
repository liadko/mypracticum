package postgres

import (
	"context"
	"database/sql"
	"errors"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
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
	roles, err := r.FetchRoles(ctx, u.ID)
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
func (r *PostgresUserRepo) FetchRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	const q = `
    SELECT r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
    `
	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var ro string
		if err := rows.Scan(&ro); err != nil {
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

// CreateUserWithRole: tx = insert user → attach roles → return user.
func (r *PostgresUserRepo) CreateUser(ctx context.Context, u domain.User) (domain.User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.User{}, err
	}
	defer func() { _ = tx.Rollback() }()

	var out domain.User
	err = tx.QueryRowContext(ctx, `
		INSERT INTO users (id, first_name, last_name, email, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, first_name, last_name, email, signature, created_at, created_by
	`, u.ID, u.FirstName, u.LastName, u.Email, u.CreatedBy).
		Scan(&out.ID, &out.FirstName, &out.LastName, &out.Email, &out.Signature, &out.CreatedAt, &out.CreatedBy)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.User{}, repository.ErrDuplicate
		}
		return domain.User{}, err
	}

	// For each role in the slice
	for _, role := range u.Roles {
		var roleID int
		if err := tx.QueryRowContext(ctx, `SELECT id FROM roles WHERE name = $1`, role).Scan(&roleID); err != nil {
			if err == sql.ErrNoRows {
				return domain.User{}, repository.ErrNotFound
			}
			return domain.User{}, err
		}

		if _, err := tx.ExecContext(ctx,
			`INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)`,
			out.ID, roleID,
		); err != nil {
			return domain.User{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return domain.User{}, err
	}

	roles, err := r.FetchRoles(ctx, out.ID)
	if err != nil && err != sql.ErrNoRows {
		return domain.User{}, err
	}
	out.Roles = roles
	return out, nil
}
