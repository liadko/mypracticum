package entry

import (
	"log"
	"net/http"
	"slices"
	"strings"

	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/format"
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
	log.Printf("[EntryHandler.Create] Creating entry")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) bind JSON → DTO
	var req CreateEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[EntryHandler.Create] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) call service
	newEntry := domain.NewEntry{
		ContactID: req.ContactID,
		DateStr:   req.DateStr,
	}
	log.Printf("[EntryHandler.Create] Adding entry for user %s", userID)
	created, err := h.svc.AddEntry(ctx.Request.Context(), userID, newEntry)
	if err != nil {
		log.Printf("[EntryHandler.Create] Failed to add entry: %v", err)
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
		DateStr:   format.Date(created.Date),
	}

	// 5) Return JSON
	ctx.JSON(http.StatusCreated, resp)
}

// Delete handles DELETE /entries/:entryId
func (h *EntryHandler) Delete(ctx *gin.Context) {
	log.Printf("[EntryHandler.Delete] Deleting entry")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	entryID, err := uuid.Parse(ctx.Param("entryId"))
	if err != nil {
		log.Printf("[EntryHandler.Delete] Invalid entry ID: %s - %v", ctx.Param("entryId"), err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}

	log.Printf("[EntryHandler.Delete] Removing entry %s for user %s", entryID, userID)
	err = h.svc.RemoveEntry(ctx, entryID, userID)

	if err != nil {
		log.Printf("[EntryHandler.Delete] Failed to delete entry: %v", err)
		switch err := err.(type) {
		case service.NotFoundError:
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ValidationError:
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListEntries handles GET /entries
func (h *EntryHandler) ListEntries(ctx *gin.Context) {
	log.Printf("[EntryHandler.ListEntries] Listing entries")
	// 1) get userID and Roles from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	rs, _ := ctx.Get("roles")
	roles, _ := rs.([]string)

	// 2) Fetch entries
	var entries []domain.Entry
	var err error
	if slices.Contains(roles, "student") {
		entries, err = h.svc.ListStudentEntries(ctx.Request.Context(), userID)
	} else {
		entries, err = h.svc.ListMentorEntries(ctx.Request.Context(), userID)

	}
	if err != nil {
		log.Printf("[EntryHandler.ListEntries] Failed to list entries: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list entries"})
		return
	}

	log.Printf("[EntryHandler.ListEntries] Retrieved %d entries", len(entries))
	// 3) Map to DTO
	resp := make([]EntryResponse, len(entries))
	for i, d := range entries {
		resp[i] = EntryResponse{
			ID:        d.ID,
			UserID:    d.UserID,
			ContactID: d.ContactID,
			DateStr:   format.Date(d.Date),
			Approved:  d.Approved,
		}
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)
}

// PATCH /entries/:entryId/approval
func (h *EntryHandler) SetApproval(ctx *gin.Context) {
	log.Printf("[EntryHandler.SetApproval] Setting approval status")
	userID := ctx.MustGet("userID").(uuid.UUID)

	// require mentor role
	if v, ok := ctx.Get("roles"); !ok || !hasRole(v.([]string), "mentor") {
		log.Printf("[EntryHandler.SetApproval] Forbidden: user not mentor")
		ctx.JSON(http.StatusForbidden, gin.H{"error": "mentor role required"})
		return
	}

	entryID, err := uuid.Parse(ctx.Param("entryId"))
	if err != nil {
		log.Printf("[EntryHandler.SetApproval] Invalid entry ID: %s - %v", ctx.Param("entryId"), err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry id"})
		return
	}

	var req ApproveEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[EntryHandler.SetApproval] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	log.Printf("[EntryHandler.SetApproval] Setting approval to %v for entry %s", req.Approved, entryID)
	updated, err := h.svc.SetApproval(ctx.Request.Context(), userID, entryID, req.Approved)
	if err != nil {
		log.Printf("[EntryHandler.SetApproval] Failed to set approval: %v", err)
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
		DateStr:   format.Date(updated.Date),
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

// POST /admin/entries/approve
func (h *EntryHandler) BulkApprove(ctx *gin.Context) {
	log.Printf("[EntryHandler.BulkApprove] Bulk approving entries")
	adminID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)

	if !hasRole(roles, "admin") {
		log.Printf("[EntryHandler.BulkApprove] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
		return
	}

	var req BulkUUIDRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		log.Printf("[EntryHandler.BulkApprove] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: require ids[}"})
		return
	}

	approved := true // Hardcoded to approve; unapprove not supported in bulk for now

	// parse UUIDs; fail fast on any invalid
	ids := make([]uuid.UUID, 0, len(req.IDs))
	for _, s := range req.IDs {
		id, err := uuid.Parse(strings.TrimSpace(s))
		if err != nil {
			log.Printf("[EntryHandler.BulkApprove] Invalid entry ID: %s - %v", s, err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry id", "value": s})
			return
		}
		ids = append(ids, id)
	}

	log.Printf("[EntryHandler.BulkApprove] Approving %d entries", len(ids))
	res, err := h.svc.BulkSetApproval(ctx.Request.Context(), adminID, ids, approved)
	if err != nil {
		log.Printf("[EntryHandler.BulkApprove] Failed to bulk approve: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

// BulkAddManualEntries handles POST /admin/entries/manual
func (h *EntryHandler) BulkAddManualEntries(ctx *gin.Context) {
	log.Printf("[EntryHandler.BulkAddManualEntries] Bulk adding manual entries")
	// 1) Get Admin UserID and Roles from context
	adminID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)

	// 2) Check for admin permissions
	if !hasRole(roles, "admin") {
		log.Printf("[EntryHandler.BulkAddManualEntries] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
		return
	}

	// 3) Bind the request payload
	var req BulkAddManualEntriesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || req.Entries == nil || len(req.Entries) == 0 {
		log.Printf("[EntryHandler.BulkAddManualEntries] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: require non-empty 'entries' array"})
		return
	}

	// 4) Parse DTOs into Domain Objects, failing fast on any invalid item
	newEntries := make([]domain.NewManualEntry, 0, len(req.Entries))
	for i, item := range req.Entries {
		userID, err := uuid.Parse(strings.TrimSpace(item.UserID))
		if err != nil {
			log.Printf("[EntryHandler.BulkAddManualEntries] Invalid userID at index %d: %v", i, err)
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid 'userId'",
				"value": item.UserID,
				"index": i,
			})
			return
		}

		// Add any other simple, fast-fail validation here
		if item.Hours == 0 {
			log.Printf("[EntryHandler.BulkAddManualEntries] Invalid hours at index %d", i)
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid 'hours': must not be zero",
				"index": i,
			})
			return
		}
		if strings.TrimSpace(item.Cause) == "" {
			log.Printf("[EntryHandler.BulkAddManualEntries] Invalid cause at index %d", i)
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid 'cause': must not be empty",
				"index": i,
			})
			return
		}
		// You could also add a check for valid 'type' here

		newEntries = append(newEntries, domain.NewManualEntry{
			UserID: userID,
			Hours:  item.Hours,
			Cause:  item.Cause,
			Type:   item.Type,
		})
	}

	log.Printf("[EntryHandler.BulkAddManualEntries] Adding %d manual entries", len(newEntries))
	result, err := h.svc.BulkAddManualEntries(ctx.Request.Context(), adminID, newEntries)
	if err != nil {
		log.Printf("[EntryHandler.BulkAddManualEntries] Failed to bulk add: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// 6) Return the result from the service
	ctx.JSON(http.StatusOK, result)
}

func (h *EntryHandler) ListManualEntries(ctx *gin.Context) {
	log.Printf("[EntryHandler.ListManualEntries] Listing manual entries")
	// 1) Get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID)

	// 2) Call the UserService
	// (We use userSvc because manual entries are a user-centric resource)
	entries, err := h.svc.ListManualEntries(ctx.Request.Context(), userID)
	if err != nil {
		log.Printf("[EntryHandler.ListManualEntries] Failed to list manual entries: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	log.Printf("[EntryHandler.ListManualEntries] Retrieved %d manual entries", len(entries))
	// 3) Map domain objects to DTOs
	resp := make([]ManualEntryResponse, 0, len(entries))
	for _, e := range entries {
		resp = append(resp, ManualEntryResponse{
			ID:        e.ID,
			UserID:    e.UserID,
			Hours:     e.Hours,
			Cause:     e.Cause,
			Type:      e.Type,
			CreatedAt: e.CreatedAt,
		})
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)
}

func (h *EntryHandler) DeleteManualEntries(ctx *gin.Context) {
	log.Printf("[EntryHandler.DeleteManualEntries] Deleting manual entries")
	// 1) Admin-only check
	adminID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)

	if !hasRole(roles, "admin") {
		log.Printf("[EntryHandler.DeleteManualEntries] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
		return
	}

	// 2) Bind the request payload
	var req BulkUUIDRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || req.IDs == nil || len(req.IDs) == 0 {
		log.Printf("[EntryHandler.DeleteManualEntries] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: require non-empty 'ids' array"})
		return
	}

	// 3) Parse and validate all UUIDs
	ids := make([]uuid.UUID, 0, len(req.IDs))
	for _, s := range req.IDs {
		id, err := uuid.Parse(strings.TrimSpace(s))
		if err != nil {
			log.Printf("[EntryHandler.DeleteManualEntries] Invalid UUID: %s - %v", s, err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid", "value": s})
			return
		}
		ids = append(ids, id)
	}

	log.Printf("[EntryHandler.DeleteManualEntries] Admin=%s Deleting %d entries", adminID, len(ids))
	// 4) Call the UserService
	result, err := h.svc.DeleteManualEntriesByIDs(ctx.Request.Context(), ids)
	if err != nil {
		log.Printf("[EntryHandler.DeleteManualEntries] Failed to delete entries: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error while deleting: " + err.Error()})
		return
	}

	// 5) Return the successful result
	ctx.JSON(http.StatusOK, result)
}

// DeleteEntries handles the bulk deletion of regular entries by admin.
func (h *EntryHandler) DeleteEntries(ctx *gin.Context) {
	log.Printf("[EntryHandler.DeleteEntries] Deleting regular entries")

	// 1) Admin-only check
	adminID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)

	if !hasRole(roles, "admin") {
		log.Printf("[EntryHandler.DeleteEntries] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
		return
	}

	// 2) Bind the request payload
	var req BulkUUIDRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || req.IDs == nil || len(req.IDs) == 0 {
		log.Printf("[EntryHandler.DeleteEntries] Invalid payload: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: require non-empty 'ids' array"})
		return
	}

	// 3) Parse and validate all UUIDs
	ids := make([]uuid.UUID, 0, len(req.IDs))
	for _, s := range req.IDs {
		id, err := uuid.Parse(strings.TrimSpace(s))
		if err != nil {
			log.Printf("[EntryHandler.DeleteEntries] Invalid UUID: %s - %v", s, err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid", "value": s})
			return
		}
		ids = append(ids, id)
	}

	log.Printf("[EntryHandler.DeleteEntries] Admin=%s Deleting %d entries", adminID, len(ids))

	// 4) Call the Service
	result, err := h.svc.DeleteEntriesByIDs(ctx.Request.Context(), ids)
	if err != nil {
		log.Printf("[EntryHandler.DeleteEntries] Failed to delete entries: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error while deleting: " + err.Error()})
		return
	}

	// 5) Return the successful result
	ctx.JSON(http.StatusOK, result)
}
