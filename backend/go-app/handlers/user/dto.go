package user

import "github.com/google/uuid"

// UserResponse is what we return to the client.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Email     string    `json:"email"`
	Taz       string    `json:"taz"`

	Signature []byte   `json:"signature,omitempty"` // raw png bytes
	Roles     []string `json:"roles,omitempty"`
}

type SignatureUpdateRequest struct {
	Signature string `json:"signature" binding:"required"` // base64 JPEG
}
type SignatureUpdateResponse struct {
	Signature string `json:"signature"` // Base64-encoded image bytes
}

type createUserRequest struct {
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"` // "admin" | "analyst" | "student" | "mentor"
}

type ProfileUpdateRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}
type ProfileUpdateResponse struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}
