package user

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"mypracticum/backend/pkg/csv"
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
			fmt.Printf("GetMe: failed to fetch user %s: %v", userID, err)
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

// UpdateProfile handles PATCH /users/me
func (h *UserHandler) UpdateProfile(ctx *gin.Context) {
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req ProfileUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": "invalid payload"})
		return
	}

	updatedFirstName, updatedLastName, err := h.svc.UpdateProfile(ctx.Request.Context(), userID, req.FirstName, req.LastName)
	if err != nil {
		var nf service.NotFoundError
		var ve domain.ValidationError
		switch {
		case errors.As(err, &ve):
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
		case errors.As(err, &nf):
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			fmt.Printf("UpdateProfile: failed to update profile for user %s: %v", userID, err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	ctx.JSON(http.StatusOK, ProfileUpdateResponse{
		FirstName: updatedFirstName,
		LastName:  updatedLastName,
	})
}

// AddUser handles POST /users
func (h *UserHandler) AddUser(ctx *gin.Context) {
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
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
		CreatedBy: userID,
	}

	// 3) Call service
	created, err := h.svc.CreateUserWithRole(ctx.Request.Context(), newUser)
	if err != nil {
		var ae service.AlreadyExistsError
		if errors.As(err, &ae) {
			ctx.JSON(http.StatusConflict, gin.H{"error": ae.Error()})
			return
		}

		// log unexpected errors
		fmt.Printf("AddUser: failed to add user: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
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

// UpdateSignature handles PATCH /users/me/signature
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
			fmt.Printf("UpdateSignature: failed to update signature for user %s: %v", userID, err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		}
		return
	}

	// encode raw bytes back to Base64 and return
	encoded := base64.StdEncoding.EncodeToString(saved)
	ctx.JSON(http.StatusOK, SignatureUpdateResponse{Signature: encoded})
}

// POST /admin/students/import
func (h *UserHandler) ImportStudents(ctx *gin.Context) {
	userID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)
	if !slices.Contains(roles, "admin") {
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing file"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "cannot open file"})
		return
	}
	defer f.Close()

	rows, parseErrs := csv.ParseStudentsCSV(f) // []domain.NewStudent + []error
	if len(rows) == 0 && len(parseErrs) > 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "csv parse error", "details": parseErrs})
		return
	}

	dry := strings.EqualFold(ctx.Query("dryRun"), "true")

	res, err := h.svc.BulkUpsertStudents(ctx.Request.Context(), rows, userID, dry)
	if err != nil {
		fmt.Printf("ImportStudents: bulk upsert failed: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// include parse warnings, if any
	if len(parseErrs) > 0 {
		res.ParseWarnings = parseErrs
	}
	ctx.JSON(http.StatusOK, res)
}
