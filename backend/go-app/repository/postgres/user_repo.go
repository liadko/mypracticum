package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"

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
	 , created_by
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
		Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Signature, &u.CreatedAt, &u.CreatedBy); err != nil {

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

func (r *PostgresUserRepo) FindByTaz(ctx context.Context, taz string) (domain.User, error) {
	if taz == "" {
		return domain.User{}, fmt.Errorf("taz can't be empty")
	}
	return r.loadUser(ctx, "taz = $1", taz)
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

func (r *PostgresUserRepo) GetIDByEmail(ctx context.Context, email string) (uuid.UUID, error) {
	const q = `SELECT id FROM users WHERE email = $1`

	var id uuid.UUID
	err := r.db.QueryRowContext(ctx, q, email).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return uuid.Nil, repository.ErrNotFound
		}
		return uuid.Nil, err
	}

	return id, nil
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

func (r *PostgresUserRepo) ListStudentsForMentor(ctx context.Context, mentorUserID uuid.UUID) ([]domain.User, error) {
	const q = `
		SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.signature, u.created_at
		  FROM contacts c
		  JOIN users    u ON u.id = c.user_id
		 WHERE c.type = 'mentor'
		   AND c.mentor_user_id = $1
		 ORDER BY u.last_name, u.first_name`

	rows, err := r.db.QueryContext(ctx, q, mentorUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Signature, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *PostgresUserRepo) UpdateUserNames(ctx context.Context, userID uuid.UUID, firstName, lastName string) (string, string, error) {
	const q = `
	UPDATE users
	   SET first_name = $1
		 , last_name  = $2
	 WHERE id = $3
	 RETURNING first_name, last_name
	`
	var outFirst string
	var outLast string
	err := r.db.QueryRowContext(ctx, q, firstName, lastName, userID).Scan(
		&outFirst,
		&outLast,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", "", repository.ErrNotFound
		}
		return "", "", err
	}
	return outFirst, outLast, nil
}

// UpsertStudent inserts a new user row and ensures role "student".
// If a user with the same email exists, it returns ErrDuplicate and does nothing.
func (r *PostgresUserRepo) UpsertStudent(ctx context.Context, ns domain.NewStudent) error {
	email := strings.ToLower(ns.Email)

	log.Printf("[upsert] BEGIN email=%s first=%q last=%q class=%q createdBy=%s", maskEmail(email), ns.FirstName, ns.LastName, ns.Class, ns.CreatedBy)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var userID uuid.UUID
	// Insert or do nothing on conflict. RETURNING only when inserted.
	err = tx.QueryRowContext(ctx, `
		INSERT INTO users (id, first_name, last_name, email, class, taz, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING
		RETURNING id
	`, uuid.New(), ns.FirstName, ns.LastName, email, ns.Class, ns.Taz, ns.CreatedBy).Scan(&userID)

	if err == sql.ErrNoRows {
		// Row already exists → skip, signal duplicate to caller.
		return repository.ErrDuplicate
	}
	if err != nil {
		return err
	}

	// Only for newly created user: ensure role "student".
	var roleID int
	if err := tx.QueryRowContext(ctx, `SELECT id FROM roles WHERE name = 'student'`).Scan(&roleID); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("role 'student' not found")
		}
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO user_roles (user_id, role_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, role_id) DO NOTHING
	`, userID, roleID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil // created=true, updated=false
}

// optional helper to avoid spraying full PII in logs
func maskEmail(e string) string {
	if e == "" {
		return ""
	}
	at := strings.IndexByte(e, '@')
	if at <= 1 {
		return "***"
	}
	name := e[:at]
	dom := e[at+1:]
	if len(name) > 2 {
		name = name[:2] + "****"
	}
	return name + "@" + dom
}

// ListStudents fetches all users with the 'student' role.
// This is a simple, single-query implementation that does NOT
// populate the Roles field on the returned users.
func (r *PostgresUserRepo) ListStudents(ctx context.Context) ([]domain.User, error) {
	// 1. Get all users who have the 'student' role.
	//    We use the same baseUserQuery from your loadUser helper.
	const studentQuery = baseUserQuery + `
    WHERE id IN (
        SELECT ur.user_id
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'student'
    )
    ORDER BY last_name, first_name
    `

	rows, err := r.db.QueryContext(ctx, studentQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// 2. Scan directly into a slice. No map or second query needed.
	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(
			&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Signature, &u.CreatedAt, &u.CreatedBy,
		); err != nil {
			return nil, err
		}
		// u.Roles will be nil
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// 3. Return the simple list.
	return users, nil
}
