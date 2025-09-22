package entry

import (
	"fmt"
	"log"
	"net/http"
	"slices"

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

// Create handles Post /entries
func (h *EntryHandler) Create(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	log.Printf("[ENTRY][Create] userID=%s clientIP=%s starting create", userID, ctx.ClientIP())

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
			log.Printf("[ENTRY][Error] service validation error: %v", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
		} else {
			log.Printf("Error While Creating Entry: %v\n", err)
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

	log.Printf("[ENTRY][Delete] userID=%s wants to delete entryID=%s", userID, entryID)

	err = h.svc.RemoveEntry(ctx, entryID, userID)

	if err != nil {
		switch err := err.(type) {
		case service.NotFoundError:
			log.Printf("[ENTRY][Error] something's not found error: %v", err)
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ValidationError:
			log.Printf("[ENTRY][Error] service validation error: %v", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			fmt.Printf("Error While Deleting Entry: %v\n", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	ctx.Status(http.StatusNoContent)
}

// List handles GET /entries
func (h *EntryHandler) List(ctx *gin.Context) {
	// 1) get userID and Roles from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	rs, _ := ctx.Get("roles")
	roles, _ := rs.([]string)

	log.Printf("[ENTRY][List] userID=%s roles=%v starting list", userID, roles)

	// 2) Fetch entries
	var entries []domain.Entry
	var err error
	if slices.Contains(roles, "student") {
		log.Printf("[ENTRY][List] using student listing flow")
		entries, err = h.svc.ListStudentEntries(ctx.Request.Context(), userID)
	} else {
		log.Printf("[ENTRY][List] using mentor listing flow")
		entries, err = h.svc.ListMentorEntries(ctx.Request.Context(), userID)

	}
	if err != nil {
		log.Printf("Error while listing: %s", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list entries"})
		return
	}

	// 3) Map to DTO
	resp := make([]EntryResponse, len(entries))
	for i, d := range entries {
		resp[i] = EntryResponse{
			ID:        d.ID,
			UserID:    d.UserID,
			ContactID: d.ContactID,
			DateStr:   d.Date.Format("2006-01-02"),
			Approved:  d.Approved,
		}
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)
}

// PATCH /entries/:entryId/approval
func (h *EntryHandler) SetApproval(ctx *gin.Context) {
	userID := ctx.MustGet("userID").(uuid.UUID)

	log.Printf("[ENTRY][SetApproval] userID=%s starting approval", userID)

	// require mentor role
	if v, ok := ctx.Get("roles"); !ok || !hasRole(v.([]string), "mentor") {
		log.Printf("[ENTRY][SetApproval] userID=%s doesn't have appropriate roles", userID)
		ctx.JSON(http.StatusForbidden, gin.H{"error": "mentor role required"})
		return
	}

	entryID, err := uuid.Parse(ctx.Param("entryId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry id"})
		return
	}

	var req ApproveEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	updated, err := h.svc.SetApproval(ctx.Request.Context(), userID, entryID, req.Approved)
	if err != nil {
		switch err.(type) {
		case service.NotFoundError:
			ctx.JSON(http.StatusNotFound, gin.H{"error": "entry not found"})
		case service.ForbiddenError:
			ctx.JSON(http.StatusForbidden, gin.H{"error": "not mentor of this entry"})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	resp := EntryResponse{
		ID:        updated.ID,
		UserID:    updated.UserID,
		ContactID: updated.ContactID,
		DateStr:   updated.Date.Format("2006-01-02"),
		Approved:  updated.Approved,
	}
	ctx.JSON(http.StatusOK, resp)
}

func hasRole(rs []string, want string) bool {
	for _, r := range rs {
		if r == want || r == "admin" {
			return true
		}
	}
	return false
}
