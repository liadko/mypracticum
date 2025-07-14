package postgres

// import (
// 	"context"
// 	"database/sql"
// 	"fmt"

// 	"mypracticum/backend/domain"
// 	"mypracticum/backend/repository"

// 	"github.com/google/uuid"
// )

// // PostgresOTPRepo is a Postgres implementation of OTPRepo.
// type PostgresOTPRepo struct {
// 	db *sql.DB
// }

// // NewPostgresOTPRepo constructs a new PostgresOTPRepo.
// func NewPostgresOTPRepo(db *sql.DB) repository.OTPRepo {
// 	return &PostgresOTPRepo{db: db}
// }

// // Save inserts a new OTP record into the otp_codes table.
// func (r *PostgresOTPRepo) Save(ctx context.Context, o domain.OTP) error {
// 	query := `INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`
// 	if _, err := r.db.ExecContext(ctx, query, o.UserID, o.Code, o.ExpiresAt); err != nil {
// 		return fmt.Errorf("insert otp: %w", err)
// 	}
// 	return nil
// }

// // Get retrieves an OTP record; returns repository.ErrNotFound if missing.
// func (r *PostgresOTPRepo) Get(ctx context.Context, userID uuid.UUID, code string) (domain.OTP, error) {
// 	var o domain.OTP
// 	query := `SELECT code, expires_at FROM otp_codes WHERE user_id=$1 AND code=$2`
// 	row := r.db.QueryRowContext(ctx, query, userID, code)
// 	if err := row.Scan(&o.Code, &o.ExpiresAt); err != nil {
// 		if err == sql.ErrNoRows {
// 			return domain.OTP{}, repository.ErrNotFound
// 		}
// 		return domain.OTP{}, fmt.Errorf("select otp: %w", err)
// 	}
// 	o.UserID = userID
// 	return o, nil
// }

// // Delete removes an OTP record; returns ErrNotFound if no row was deleted.
// func (r *PostgresOTPRepo) Delete(ctx context.Context, userID uuid.UUID, code string) error {
// 	query := `DELETE FROM otp_codes WHERE user_id=$1 AND code=$2`
// 	res, err := r.db.ExecContext(ctx, query, userID, code)
// 	if err != nil {
// 		return fmt.Errorf("delete otp: %w", err)
// 	}
// 	n, err := res.RowsAffected()
// 	if err != nil {
// 		return fmt.Errorf("delete otp rows affected: %w", err)
// 	}
// 	if n == 0 {
// 		return repository.ErrNotFound
// 	}
// 	return nil
// }
