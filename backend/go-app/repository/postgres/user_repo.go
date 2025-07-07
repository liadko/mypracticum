package postgres

import (
	"context"
	"database/sql"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
)

type PostgresUserRepo struct {
	db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) repository.UserRepository {
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
