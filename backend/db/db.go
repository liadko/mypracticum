package db

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

// Connect opens and pings the Postgres database.
func Connect(connStr string) (*sql.DB, error) {
	log.Println("Bro")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
