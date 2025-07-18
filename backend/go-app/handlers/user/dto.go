package user

import "github.com/google/uuid"

// UserResponse is what we return to the client.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Email     string    `json:"email"`

	Signature []byte   `json:"signature,omitempty"` // auto‐Base64 in JSON
	Roles     []string `json:"roles"`
}

// SignatureUpdateRequest is sent by the client as a data URL string.
type SignatureUpdateRequest struct {
	// e.g. "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
	SignatureSVG string `json:"signatureSvg" binding:"required"`
}

// SignatureUpdateResponse is sent back after a successful PATCH.
type SignatureUpdateResponse struct {
	SignatureSVG string `json:"signatureSvg"`
}
