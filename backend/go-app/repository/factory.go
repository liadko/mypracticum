package repository

type Factory interface {
	EntryRepo() EntryRepo
	ContactRepo() ContactRepo
	UserRepo() UserRepo
	ReportRepo() ReportRepo
	// OTPRepo() OTPRepo
}
