package handlers

import (
	"net/http"

	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
)

type EntryHandler struct {
	svc *service.EntryService
}

func NewEntryHandler(
	svc *service.EntryService,
) *EntryHandler {
	return &EntryHandler{svc: svc}
}

// List handles GET /api/:studentId/entries
func (h *EntryHandler) List(c *gin.Context) {
	// 1) get userID from the context
	userID := c.GetString("userID")

	// 2) Fetch entries
	entries, err := h.svc.ListEntries(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list entries"})
		return
	}

	// 3) Map to DTO
	resp := make([]EntryResponse, len(entries))
	for i, d := range entries {
		resp[i] = EntryResponse{
			ID:        d.ID,
			ContactID: d.ContactID,
			Date:      d.Date,
			Approved:  d.Approved,
		}
	}

	// 4) Return JSON
	c.JSON(http.StatusOK, resp)
}
