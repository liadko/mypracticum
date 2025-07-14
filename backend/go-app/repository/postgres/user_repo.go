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

func (r *PostgresUserRepo) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	const q = `
    SELECT id, email
      FROM users
     WHERE email = $1
    `
	var u domain.User
	err := r.db.QueryRowContext(ctx, q, email).
		Scan(&u.ID, &u.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.User{}, repository.ErrNotFound
		}
		return domain.User{}, err
	}
	return u, nil
}

func (r *PostgresUserRepo) FindByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	const q = `
    SELECT id, email
      FROM users
     WHERE id = $1
    `
	var u domain.User
	err := r.db.QueryRowContext(ctx, q, id).
		Scan(&u.ID, &u.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.User{}, repository.ErrNotFound
		}
		return domain.User{}, err
	}
	return u, nil
}
