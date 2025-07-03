package handlers

import (
	"net/http"

	"mypracticum/backend/domain"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
)

type ContactHandler struct {
	svc *service.ContactService
}

func NewContactHandler(svc *service.ContactService) *ContactHandler {
	return &ContactHandler{svc: svc}
}

// List handles GET /api/:studentId/contacts
func (h *ContactHandler) List(c *gin.Context) {

	// 1) get userID from the context
	userID := c.GetString("userID")

	// 2) Fetch from service
	domainContacts, err := h.svc.ListContacts(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list contacts"})
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
	c.JSON(http.StatusOK, resp)

}

// List handles PUT /api/:studentID/contacts/:contactID
func (h *ContactHandler) Update(c *gin.Context) {

	// 1) get userID from the context
	userID := c.GetString("userID")

	contactID := c.Param("contactID")

	if contactID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "no contactID detected"})
		return
	}

	// 2) talk to service
	domainContacts, err := h.svc.UpdateContact(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update contacts"})
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
	c.JSON(http.StatusOK, resp)

}

// Create handles POST /api/:studentID/contacts
func (h *ContactHandler) Create(c *gin.Context) {
	userID := c.GetString("userID")

	var req NewContactDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	saved, err := h.svc.AddContact(c.Request.Context(), userID, newContact)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, saved)
}
