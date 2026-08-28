package domain

// UserProfile combines the core user record with its optional class details.
// Class data is deliberately not embedded in User because most user lookups do
// not need it.
type UserProfile struct {
	User  User
	Class *Class
}
