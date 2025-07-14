package user

import "github.com/google/uuid"

// UserResponse is what we return to the client.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Email     string    `json:"email"`
	Roles     []string  `json:"roles"`
}
