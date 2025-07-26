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

func (f *PostgresFactory) ContactRepo() repository.ContactRepo {
	return NewPostgresContactRepo(f.db)
}

func (f *PostgresFactory) EntryRepo() repository.EntryRepo {
	return NewPostgresEntryRepo(f.db)
}

func (f *PostgresFactory) UserRepo() repository.UserRepo {
	return NewPostgresUserRepo(f.db)
}

// func (f *PostgresFactory) OTPRepo() repository.OTPRepo {
// 	return NewPostgresOTPRepo(f.db)
// }
