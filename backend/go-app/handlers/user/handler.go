package user

import (
	"encoding/base64"
	"errors"
	"net/http"

	"mypracticum/backend/service"

	"mypracticum/backend/domain"

	"slices"

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
		Signature: user.Signature,
	}
	// flatten roles
	for _, r := range user.Roles {
		resp.Roles = append(resp.Roles, string(r))
	}

	ctx.JSON(http.StatusOK, resp)
}

// AddUser handles POST /users
func (h *UserHandler) AddUser(ctx *gin.Context) {
	roles := ctx.MustGet("roles").([]string)
	if !slices.Contains(roles, "admin") {
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// 1) Bind input
	var req createUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// 2) Construct domain object
	newUser := domain.NewUserWithRole{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Role:      req.Role,
		CreatedBy: req.CreatedBy,
	}

	// 3) Call service
	created, err := h.svc.CreateUserWithRole(ctx.Request.Context(), newUser)
	if err != nil {
		switch err {
		case service.AlreadyExistsError{}:
			ctx.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// 4) Map to response
	resp := UserResponse{
		ID:        created.ID,
		FirstName: created.FirstName,
		LastName:  created.LastName,
		Email:     created.Email,
		Signature: created.Signature,
		Roles:     created.Roles,
	}

	ctx.JSON(http.StatusCreated, resp)
}

// UpdateSignature handles PATCH /users/me
func (h *UserHandler) UpdateSignature(ctx *gin.Context) {
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req SignatureUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": "invalid payload"})
		return
	}

	// decode base64 → raw []byte
	data, err := base64.StdEncoding.DecodeString(req.Signature)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "bad base64"})
		return
	}

	saved, err := h.svc.UpdateSignature(ctx.Request.Context(), userID, data)
	if err != nil {
		var nf service.NotFoundError

		switch {
		case errors.As(err, &nf):
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// encode raw bytes back to Base64 and return
	encoded := base64.StdEncoding.EncodeToString(saved)
	ctx.JSON(http.StatusOK, SignatureUpdateResponse{Signature: encoded})
}
