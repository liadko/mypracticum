package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// Connect opens and verifies the Postgres database connection.
func Connect(connStr string) (*sql.DB, error) {

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres connection: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return db, nil
}
