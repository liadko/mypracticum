package user

import "github.com/google/uuid"

type ClassDTO struct {
	ID                 uuid.UUID `json:"id"`
	Name               string    `json:"name"`
	ClientStartDate    *string   `json:"clientStartDate"`
	MentorStartDate    *string   `json:"mentorStartDate"`
	TherapistStartDate *string   `json:"therapistStartDate"`
}

type ReportingStartDatesDTO struct {
	Client    *string `json:"client"`
	Mentor    *string `json:"mentor"`
	Therapist *string `json:"therapist"`
}

type AdminClassResponse struct {
	ID                  uuid.UUID              `json:"id"`
	Name                string                 `json:"name"`
	ReportingStartDates ReportingStartDatesDTO `json:"reportingStartDates"`
}

type AdminClassRequest struct {
	Name                string                  `json:"name" binding:"required"`
	ReportingStartDates *ReportingStartDatesDTO `json:"reportingStartDates" binding:"required"`
}

type ProfileResponse struct {
	UserResponse
	Class *ClassDTO `json:"class"`
}

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
