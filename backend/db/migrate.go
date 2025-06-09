package db

import "database/sql"

// Migrate creates all the tables your app needs.
// Call this once at startup.
func Migrate(db *sql.DB) error {
	stmts := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

		`CREATE TABLE IF NOT EXISTS users (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       id_number TEXT UNIQUE NOT NULL,
       name TEXT,
       signature BYTEA,
       created_at TIMESTAMPTZ DEFAULT now()
     );`,

		`CREATE TABLE IF NOT EXISTS mentors (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       email TEXT NOT NULL,
       specialty TEXT NOT NULL CHECK (specialty IN ('clinical','dynamic','skateboarder')),
       created_at TIMESTAMPTZ DEFAULT now()
     );`,

		`CREATE TABLE IF NOT EXISTS external_therapists (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       created_at TIMESTAMPTZ DEFAULT now()
     );`,

		`CREATE TABLE IF NOT EXISTS entries (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       date DATE NOT NULL,
       type TEXT NOT NULL CHECK (type IN ('personal','mentor','client')),
       mentor_id UUID REFERENCES mentors(id),
       external_therapist_id UUID REFERENCES external_therapists(id),
       client_name TEXT,
       created_at TIMESTAMPTZ DEFAULT now()
     );`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return err
		}
	}
	return nil
}
