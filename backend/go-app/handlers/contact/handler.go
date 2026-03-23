package contact

import (
	"fmt"
	"log"
	"net/http"
	"slices"

	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/format"
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
	log.Printf("[ContactHandler.List] Starting - retrieving contacts for user")
	userID := ctx.MustGet("userID").(uuid.UUID)
	log.Printf("[ContactHandler.List] Extracted userID: %s", userID)

	rs, _ := ctx.Get("roles") // set by JWT middleware
	roles, _ := rs.([]string)
	log.Printf("[ContactHandler.List] User roles: %v", roles)

	var contacts []domain.Contact
	var err error
	if slices.Contains(roles, "student") {
		log.Printf("[ContactHandler.List] User is student, calling ListStudentContacts")
		contacts, err = h.svc.ListStudentContacts(ctx.Request.Context(), userID)
	} else {
		log.Printf("[ContactHandler.List] User is mentor, calling ListMentorStudentsAsContacts")
		contacts, err = h.svc.ListMentorStudentsAsContacts(ctx.Request.Context(), userID)
	}

	if err != nil {
		log.Printf("[ContactHandler.List] Error retrieving contacts for user %s: %v", userID, err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list contacts"})
		return
	}

	log.Printf("[ContactHandler.List] Successfully retrieved %d contacts, building response", len(contacts))
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
	log.Printf("[ContactHandler.List] Returning %d contacts", len(resp))
	ctx.JSON(http.StatusOK, resp)
}

// Update handles PUT /contacts/:contactId
func (h *ContactHandler) Update(ctx *gin.Context) {
	log.Printf("[ContactHandler.Update] Starting - updating contact")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	log.Printf("[ContactHandler.Update] Extracted userID: %s", userID)

	contactID, err := uuid.Parse(ctx.Param("contactId"))
	if err != nil {
		log.Printf("[ContactHandler.Update] Invalid contact ID format: %s - error: %v", ctx.Param("contactId"), err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}
	log.Printf("[ContactHandler.Update] Parsed contactID: %s", contactID)

	var req NewContactDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[ContactHandler.Update] Failed to parse JSON body: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("[ContactHandler.Update] Successfully parsed request body")

	if req.Email != nil {
		cleanEmail := format.SanitizeEmail(*req.Email)
		req.Email = &cleanEmail
	}

	// build the temporary NewContact
	newContact := domain.NewContact{
		Type:                     req.Type,
		Name:                     format.CleanText(req.Name),
		Email:                    req.Email,
		Phone:                    req.Phone,
		Specialty:                req.Specialty,
		ClientInstitution:        req.ClientInstitution,
		ClientTrainingCenterInfo: req.ClientTrainingCenterInfo,
	}
	log.Printf("[ContactHandler.Update] Calling service to update contact %s for user %s", contactID, userID)

	saved, err := h.svc.UpdateContact(ctx.Request.Context(), userID, contactID, newContact)
	if err != nil {
		log.Printf("[ContactHandler.Update] Service returned error: %v (type: %T)", err, err)
		switch e := err.(type) {
		case domain.ValidationError:
			log.Printf("[ContactHandler.Update] Validation error: %v", e)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		case service.NotFoundError:
			log.Printf("[ContactHandler.Update] Not found error: %v", e)
			ctx.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		case service.AlreadyExistsError:
			log.Printf("[ContactHandler.Update] Already exists error: %v", e)
			ctx.JSON(http.StatusConflict, gin.H{"error": e.Error()})

		default:
			// everything else is a 500
			log.Printf("[ContactHandler.Update] Internal server error: %v", e)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	log.Printf("[ContactHandler.Update] Contact updated successfully, building response")
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

	log.Printf("[ContactHandler.Update] Returning updated contact: %s", saved.ID)
	ctx.JSON(http.StatusOK, resp)
}

// Create handles POST /contacts
func (h *ContactHandler) Create(ctx *gin.Context) {
	log.Printf("[ContactHandler.Create] Starting - creating new contact")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	log.Printf("[ContactHandler.Create] Extracted userID: %s", userID)

	var req NewContactDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[ContactHandler.Create] Failed to parse JSON body: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("[ContactHandler.Create] Successfully parsed request body - Name: %s, Type: %s", req.Name, req.Type)

	if req.Email != nil {
		cleanEmail := format.SanitizeEmail(*req.Email)
		req.Email = &cleanEmail
	}

	// build the temporary NewContact
	nc := domain.NewContact{
		Type:                     req.Type,
		Name:                     format.CleanText(req.Name),
		Email:                    req.Email,
		Phone:                    req.Phone,
		Specialty:                req.Specialty,
		ClientInstitution:        req.ClientInstitution,
		ClientTrainingCenterInfo: req.ClientTrainingCenterInfo,
	}
	log.Printf("[ContactHandler.Create] Calling service to add contact for user %s", userID)

	saved, err := h.svc.AddContact(ctx.Request.Context(), userID, nc)
	if err != nil {
		log.Printf("[ContactHandler.Create] Service returned error: %v (type: %T)", err, err)
		if ve, ok := err.(domain.ValidationError); ok {
			log.Printf("[ContactHandler.Create] Validation error: %v", ve)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
			return
		}
		if ae, ok := err.(service.AlreadyExistsError); ok {
			log.Printf("[ContactHandler.Create] Already exists error - Resource: %s, Field: %s, Value: %s", ae.Resource, ae.Field, ae.Value)
			ctx.JSON(http.StatusConflict, gin.H{
				"error": fmt.Sprintf("%s with %s '%s' already exists",
					ae.Resource, ae.Field, ae.Value),
			})
			return
		}
		log.Printf("[ContactHandler.Create] Internal server error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	log.Printf("[ContactHandler.Create] Contact created successfully with ID: %s", saved.ID)
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

	log.Printf("[ContactHandler.Create] Returning created contact")
	ctx.JSON(http.StatusCreated, resp)

}

// InviteMentor handles POST /contacts/:contactId/invite
func (h *ContactHandler) InviteMentor(ctx *gin.Context) {
	log.Printf("[ContactHandler.InviteMentor] Starting - inviting mentor")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	log.Printf("[ContactHandler.InviteMentor] Inviter User id: %s", userID)

	contactID, err := uuid.Parse(ctx.Param("contactId"))
	if err != nil {
		log.Printf("[ContactHandler.InviteMentor] Invalid contact ID format: %s - error: %v", ctx.Param("contactId"), err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid contact ID"})
		return
	}
	log.Printf("[ContactHandler.InviteMentor] Invitee contactID: %s", contactID)

	// directly call service with userID and contactID
	log.Printf("[ContactHandler.InviteMentor] Calling service to send invitation")
	if err := h.svc.InviteMentor(ctx.Request.Context(), userID, contactID); err != nil {
		log.Printf("[ContactHandler.InviteMentor] Service returned error: %v (type: %T)", err, err)
		if ve, ok := err.(domain.ValidationError); ok {
			log.Printf("[ContactHandler.InviteMentor] Validation error: %v", ve)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
			return
		}
		log.Printf("[ContactHandler.InviteMentor] Internal server error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	log.Printf("[ContactHandler.InviteMentor] Invitation sent successfully for mentor %s to student %s", contactID, userID)
	ctx.JSON(http.StatusOK, gin.H{"status": "invitation sent"})
}
