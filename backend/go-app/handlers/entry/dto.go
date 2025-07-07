package entry

// CreateEntryRequest is the JSON payload for POST /api/:studentId/entries
type CreateEntryRequest struct {
	ContactID string `json:"contactId" binding:"required,uuid"`
	DateStr   string `json:"date" binding:"required,datetime=2006-01-02"`
}

// UpdateEntryRequest is the JSON payload for PATCH /api/:studentId/entries/:entryId
// Use to update the approved flag.
type UpdateEntryRequest struct {
	Approved bool `json:"approved" binding:"required"`
}

// EntryResponse is the JSON shape returned by all entry endpoints.
type EntryResponse struct {
	ID        string `json:"id"`
	ContactID string `json:"contactId"`
	DateStr   string `json:"date"`
}
