package contact

import (
	"fmt"
	"log"
	"net/http"

	"mypracticum/backend/domain"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ContactHandler struct {
	svc *service.ContactService
}

func NewContactHandler(svc *service.ContactService) *ContactHandler {
	return &ContactHandler{svc: svc}
}

// List handles GET /contacts
func (h *ContactHandler) List(ctx *gin.Context) {

	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) Fetch from service
	domainContacts, err := h.svc.ListContacts(ctx.Request.Context(), userID)
	if err != nil {
		log.Println(err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list contacts"})
		return
	}

	// 3) Map to DTO
	resp := make([]ContactResponse, len(domainContacts))
	for i, d := range domainContacts {
		resp[i] = ContactResponse{
			ID:        d.ID,
			UserID:    d.UserID,
			Type:      string(d.Type),
			Name:      d.Name,
			Email:     d.Email,
			Phone:     d.Phone,
			Specialty: d.Specialty,
		}
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)

}

// Update handles PUT /contacts/:contactId
func (h *ContactHandler) Update(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	contactID, err := uuid.Parse(ctx.Param("contactId"))
	if err != nil {
		log.Println(err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}

	var req NewContactDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// build the temporary NewContact
	newContact := domain.NewContact{
		Type:      req.Type,
		Name:      req.Name,
		Email:     req.Email,
		Phone:     req.Phone,
		Specialty: req.Specialty,
	}

	saved, err := h.svc.UpdateContact(ctx.Request.Context(), userID, contactID, newContact)
	if err != nil {
		switch e := err.(type) {
		case domain.ValidationError:
			ctx.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		case service.NotFoundError:
			ctx.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		default:
			// everything else is a 500
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// map domain.Contact → DTO
	resp := ContactResponse{
		ID:        saved.ID,
		UserID:    saved.UserID,
		Type:      string(saved.Type),
		Name:      saved.Name,
		Email:     saved.Email,
		Phone:     saved.Phone,
		Specialty: saved.Specialty,
	}

	ctx.JSON(http.StatusOK, resp)
}

// Create handles POST /contacts
func (h *ContactHandler) Create(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req NewContactDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// build the temporary NewContact
	nc := domain.NewContact{
		Type:      req.Type,
		Name:      req.Name,
		Email:     req.Email,
		Phone:     req.Phone,
		Specialty: req.Specialty,
	}

	saved, err := h.svc.AddContact(ctx.Request.Context(), userID, nc)
	if err != nil {
		if ve, ok := err.(domain.ValidationError); ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
			return
		}
		if ae, ok := err.(service.AlreadyExistsError); ok {
			ctx.JSON(http.StatusConflict, gin.H{
				"error": fmt.Sprintf("%s with %s '%s' already exists",
					ae.Resource, ae.Field, ae.Value),
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// map domain.Contact → DTO
	resp := ContactResponse{
		ID:        saved.ID,
		UserID:    saved.UserID,
		Type:      string(saved.Type),
		Name:      saved.Name,
		Email:     saved.Email,
		Phone:     saved.Phone,
		Specialty: saved.Specialty,
	}

	ctx.JSON(http.StatusCreated, resp)
}
