package entry

import (
	"log"
	"net/http"

	"mypracticum/backend/domain"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EntryHandler struct {
	svc *service.EntryService
}

func NewEntryHandler(
	svc *service.EntryService,
) *EntryHandler {
	return &EntryHandler{svc: svc}
}

// Create handles Post /:studentId/entries
func (h *EntryHandler) Create(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) bind JSON → DTO
	var req CreateEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("Create BindJSON error: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) call service
	newEntry := domain.NewEntry{
		ContactID: req.ContactID,
		DateStr:   req.DateStr,
	}
	created, err := h.svc.AddEntry(ctx.Request.Context(), userID, newEntry)
	if err != nil {
		if ve, ok := err.(domain.ValidationError); ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// 4) map domain.Entry → DTO
	resp := EntryResponse{
		ID:        created.ID,
		ContactID: created.ContactID,
		DateStr:   created.Date.Format("2006-01-02"),
	}

	// 5) Return JSON
	ctx.JSON(http.StatusCreated, resp)
}

// Delete handles DELETE /entries/:entryId
func (h *EntryHandler) Delete(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	entryID, err := uuid.Parse(ctx.Param("entryId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}

	err = h.svc.RemoveEntry(ctx, entryID, userID)

	if err != nil {
		switch err := err.(type) {
		case service.NotFoundError:
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	ctx.Status(http.StatusNoContent)
}

// List handles GET /entries
func (h *EntryHandler) List(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) Fetch entries
	entries, err := h.svc.ListEntries(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list entries"})
		return
	}

	// 3) Map to DTO
	resp := make([]EntryResponse, len(entries))
	for i, d := range entries {
		resp[i] = EntryResponse{
			ID:        d.ID,
			ContactID: d.ContactID,
			DateStr:   d.Date.Format("2006-01-02"),
			//Approved:  d.Approved,
		}
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)
}
