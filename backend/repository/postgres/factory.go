package postgres

import (
	"database/sql"
	"mypracticum/backend/repository"
)

type PostgresFactory struct {
	db *sql.DB
}

func NewPostgresFactory(db *sql.DB) repository.Factory {
	return &PostgresFactory{db: db}
}

func (f *PostgresFactory) ContactRepo() repository.ContactRepository {
	return NewPostgresContactRepo(f.db)
}

func (f *PostgresFactory) EntryRepo() repository.EntryRepository {
	return NewPostgresEntryRepo(f.db)
}

func (f *PostgresFactory) UserRepo() repository.UserRepository {
	return NewPostgresUserRepo(f.db)
}
