package postgres

import (
	"context"
	"database/sql"

	"mypracticum/backend/repository"
)

type PostgresUserRepo struct {
	db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) repository.UserRepository {
	return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) GetByStudentID(ctx context.Context, studentID string) (string, error) {
	const q = `
    SELECT id
      FROM users
     WHERE student_id = $1
  `
	var userID string
	if err := r.db.QueryRowContext(ctx, q, studentID).Scan(&userID); err != nil {
		return "", err
	}
	return userID, nil
}
