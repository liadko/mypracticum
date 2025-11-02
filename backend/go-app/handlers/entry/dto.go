package entry

import (
	"time"

	"github.com/google/uuid"
)

// CreateEntryRequest is the JSON payload for POST /entries
type CreateEntryRequest struct {
	ContactID uuid.UUID `json:"contactId" binding:"required,uuid"`
	DateStr   string    `json:"date" binding:"required,datetime=2006-01-02"`
}

// ApproveEntryRequest is the JSON payload for PATCH /entries/:entryId/approval
// Use to update the approved flag.
type ApproveEntryRequest struct {
	Approved bool `json:"approved"`
}

// EntryResponse is the JSON shape returned by all entry endpoints.
type EntryResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	ContactID uuid.UUID `json:"contactId"`
	DateStr   string    `json:"date"`
	Approved  bool      `json:"approved"`
}

type ManualEntryRequest struct {
	UserID string `json:"userId"`
	Hours  int    `json:"hours"`
	Cause  string `json:"cause"`
	Type   string `json:"type"` // "client", "mentor", or "therapist"
}

// BulkAddManualEntriesRequest is the payload for the bulk manual entry endpoint.
type BulkAddManualEntriesRequest struct {
	Entries []ManualEntryRequest `json:"entries"`
}

// ManualEntryResponse is the DTO for a manual entry.
type ManualEntryResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Hours     int       `json:"hours"`
	Cause     string    `json:"cause"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
}

// BulkUUIDRequest is a generic request for any bulk operation
// that takes a list of IDs.
type BulkUUIDRequest struct {
	IDs []string `json:"ids"`
}
