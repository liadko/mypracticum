package handlers

import (
	"net/http"

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
	contacts, err := h.svc.ListContacts(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list contacts"})
		return
	}

	// 3) Return JSON
	c.JSON(http.StatusOK, contacts)
}
