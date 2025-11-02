package entry

import (
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

type BulkApproveRequest struct {
	IDs      []string `json:"ids" binding:"required"`
	Approved *bool    `json:"approved,omitempty"` // default true
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
