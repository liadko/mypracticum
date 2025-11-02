package contact

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

type ContactHandler struct {
	svc *service.ContactService
}

func NewContactHandler(svc *service.ContactService) *ContactHandler {
	return &ContactHandler{svc: svc}
}

// List handles GET /contacts
func (h *ContactHandler) List(ctx *gin.Context) {
	userID := ctx.MustGet("userID").(uuid.UUID)
	rs, _ := ctx.Get("roles") // set by JWT middleware
	roles, _ := rs.([]string)

	var contacts []domain.Contact
	var err error
	if slices.Contains(roles, "student") {
		contacts, err = h.svc.ListStudentContacts(ctx.Request.Context(), userID)
	} else {
		contacts, err = h.svc.ListMentorStudentsAsContacts(ctx.Request.Context(), userID)
	}

	if err != nil {
		log.Printf("Error while Listing Contacts for user %s: %v", userID, err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list contacts"})
		return
	}

	resp := make([]ContactResponse, len(contacts))
	for i, d := range contacts {
		resp[i] = ContactResponse{
			ID:                       d.ID,
			Type:                     string(d.Type),
			Name:                     d.Name,
			Email:                    d.Email,
			Phone:                    d.Phone,
			Specialty:                d.Specialty,
			ClientInstitution:        d.ClientInstitution,
			ClientTrainingCenterInfo: d.ClientTrainingCenterInfo,
		}
	}
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
		Type:                     req.Type,
		Name:                     req.Name,
		Email:                    req.Email,
		Phone:                    req.Phone,
		Specialty:                req.Specialty,
		ClientInstitution:        req.ClientInstitution,
		ClientTrainingCenterInfo: req.ClientTrainingCenterInfo,
	}

	saved, err := h.svc.UpdateContact(ctx.Request.Context(), userID, contactID, newContact)
	if err != nil {
		switch e := err.(type) {
		case domain.ValidationError:
			fmt.Printf("Error while adding contact, validation apparently: %v\n", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		case service.NotFoundError:
			fmt.Printf("Error while adding contact, something isn't found: %v\n", err)
			ctx.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		case service.AlreadyExistsError:
			ctx.JSON(http.StatusConflict, gin.H{"error": e.Error()})

		default:
			// everything else is a 500
			fmt.Printf("Error while updating contact, something internal: %v\n", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// map domain.Contact → DTO
	resp := ContactResponse{
		ID:                       saved.ID,
		Type:                     string(saved.Type),
		Name:                     saved.Name,
		Email:                    saved.Email,
		Phone:                    saved.Phone,
		Specialty:                saved.Specialty,
		ClientInstitution:        saved.ClientInstitution,
		ClientTrainingCenterInfo: saved.ClientTrainingCenterInfo,
	}

	ctx.JSON(http.StatusOK, resp)
}

// Create handles POST /contacts
func (h *ContactHandler) Create(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req NewContactDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Error while binding the new-contact json: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// build the temporary NewContact
	nc := domain.NewContact{
		Type:                     req.Type,
		Name:                     req.Name,
		Email:                    req.Email,
		Phone:                    req.Phone,
		Specialty:                req.Specialty,
		ClientInstitution:        req.ClientInstitution,
		ClientTrainingCenterInfo: req.ClientTrainingCenterInfo,
	}

	saved, err := h.svc.AddContact(ctx.Request.Context(), userID, nc)
	if err != nil {
		if ve, ok := err.(domain.ValidationError); ok {
			fmt.Printf("Error while adding contact, validation apparently: %v\n", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
			return
		}
		if ae, ok := err.(service.AlreadyExistsError); ok {
			fmt.Printf("Error while adding contact, something already exists: %v\n", err)
			ctx.JSON(http.StatusConflict, gin.H{
				"error": fmt.Sprintf("%s with %s '%s' already exists",
					ae.Resource, ae.Field, ae.Value),
			})
			return
		}
		fmt.Printf("Error while adding contact, something internal: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// map domain.Contact → DTO
	resp := ContactResponse{
		ID:                       saved.ID,
		Type:                     string(saved.Type),
		Name:                     saved.Name,
		Email:                    saved.Email,
		Phone:                    saved.Phone,
		Specialty:                saved.Specialty,
		ClientInstitution:        saved.ClientInstitution,
		ClientTrainingCenterInfo: saved.ClientTrainingCenterInfo,
	}

	ctx.JSON(http.StatusCreated, resp)

}

// InviteMentor handles POST /contacts/:contactId/invite
func (h *ContactHandler) InviteMentor(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	contactID, err := uuid.Parse(ctx.Param("contactId"))
	if err != nil {
		log.Println(err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}

	// directly call service with userID and contactID
	if err := h.svc.InviteMentor(ctx.Request.Context(), userID, contactID); err != nil {
		if ve, ok := err.(domain.ValidationError); ok {
			fmt.Printf("Error while adding contact, validation apparently: %v\n", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
			return
		}
		fmt.Printf("Error while inviting mentor: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "invitation sent"})
}
