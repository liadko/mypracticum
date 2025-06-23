package repository

type Factory interface {
	EntryRepo() EntryRepository
	ContactRepo() ContactRepository
	UserRepo() UserRepository
}
