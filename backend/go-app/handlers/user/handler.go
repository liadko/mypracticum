package user

import (
	"net/http"

	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(
	svc *service.UserService,
) *UserHandler {
	return &UserHandler{svc: svc}
}

// GetMe handles GET /users/me
func (h *UserHandler) GetMe(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) Lookup user by ID
	user, err := h.svc.GetUserByID(ctx.Request.Context(), userID)
	if err != nil {
		switch err.(type) {
		case service.NotFoundError:
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// 3) Map to response DTO
	resp := UserResponse{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Email:     user.Email,
	}
	// flatten roles
	for _, r := range user.Roles {
		resp.Roles = append(resp.Roles, string(r.Name))
	}

	ctx.JSON(http.StatusOK, resp)
}
