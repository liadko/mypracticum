package user

import "github.com/google/uuid"

// UserResponse is what we return to the client.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Email     string    `json:"email"`

	Signature []byte   `json:"signature,omitempty"` // raw png bytes
	Roles     []string `json:"roles"`
}

type SignatureUpdateRequest struct {
	Signature string `json:"signature" binding:"required"` // base64 JPEG
}
type SignatureUpdateResponse struct {
	Signature string `json:"signature"` // Base64-encoded image bytes
}
