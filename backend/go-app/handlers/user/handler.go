package user

import (
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"strings"

	"mypracticum/backend/pkg/csv"
	"mypracticum/backend/pkg/format"
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
	log.Printf("[UserHandler.GetMe] Retrieving user profile")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	// 2) Lookup user by ID
	user, err := h.svc.GetUserByID(ctx.Request.Context(), userID)
	if err != nil {
		log.Printf("[UserHandler.GetMe] Failed to fetch user %s: %v", userID, err)
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
		Taz:       user.Taz,
		Signature: user.Signature,
	}
	// flatten roles
	for _, r := range user.Roles {
		resp.Roles = append(resp.Roles, string(r))
	}

	log.Printf("[UserHandler.GetMe] Retrieved user profile for user ID: %s, name: %s %s, email: %s", user.ID, user.FirstName, user.LastName, user.Email)
	ctx.JSON(http.StatusOK, resp)
}

// UpdateProfile handles PATCH /users/me
func (h *UserHandler) UpdateProfile(ctx *gin.Context) {
	log.Printf("[UserHandler.UpdateProfile] Updating user profile")
	// 1) get userID from the context
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req ProfileUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[UserHandler.UpdateProfile] Invalid payload: %v", err)
		ctx.JSON(400, gin.H{"error": "invalid payload"})
		return
	}

	newFirstName := format.CleanText(req.FirstName)
	newLastName := format.CleanText(req.LastName)

	updatedFirstName, updatedLastName, err := h.svc.UpdateProfile(ctx.Request.Context(), userID, newFirstName, newLastName)
	if err != nil {
		log.Printf("[UserHandler.UpdateProfile] Failed to update profile for user %s: %v", userID, err)
		var nf service.NotFoundError
		var ve domain.ValidationError
		switch {
		case errors.As(err, &ve):
			ctx.JSON(http.StatusBadRequest, gin.H{"error": ve.Error()})
		case errors.As(err, &nf):
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
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
	log.Printf("[UserHandler.AddUser] Creating new user")
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware
	roles := ctx.MustGet("roles").([]string)

	if !slices.Contains(roles, "admin") {
		log.Printf("[UserHandler.AddUser] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// 1) Bind input
	var req createUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[UserHandler.AddUser] Invalid input: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	cleanEmail := format.SanitizeEmail(req.Email)

	// 2) Construct domain object
	newUser := domain.NewUserWithRole{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     cleanEmail,
		Role:      req.Role,
		CreatedBy: userID,
	}

	// 3) Call service
	created, err := h.svc.CreateUserWithRole(ctx.Request.Context(), newUser)
	if err != nil {
		log.Printf("[UserHandler.AddUser] Failed to add user: %v", err)
		var ae service.AlreadyExistsError
		if errors.As(err, &ae) {
			ctx.JSON(http.StatusConflict, gin.H{"error": ae.Error()})
			return
		}

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
	log.Printf("[UserHandler.UpdateSignature] Updating user signature")
	userID := ctx.MustGet("userID").(uuid.UUID) // guaranteed to exist, thanks to middleware

	var req SignatureUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[UserHandler.UpdateSignature] Invalid payload: %v", err)
		ctx.JSON(400, gin.H{"error": "invalid payload"})
		return
	}

	// decode base64 → raw []byte
	data, err := base64.StdEncoding.DecodeString(req.Signature)
	if err != nil {
		log.Printf("[UserHandler.UpdateSignature] Bad base64: %v", err)
		ctx.JSON(400, gin.H{"error": "bad base64"})
		return
	}

	saved, err := h.svc.UpdateSignature(ctx.Request.Context(), userID, data)
	if err != nil {
		log.Printf("[UserHandler.UpdateSignature] Failed to update signature for user %s: %v", userID, err)
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

// POST /admin/students/import
func (h *UserHandler) ImportStudents(ctx *gin.Context) {
	log.Printf("[UserHandler.ImportStudents] Importing students from CSV")
	userID := ctx.MustGet("userID").(uuid.UUID)
	roles := ctx.MustGet("roles").([]string)

	if !slices.Contains(roles, "admin") {
		log.Printf("[UserHandler.ImportStudents] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		log.Printf("[UserHandler.ImportStudents] Missing file: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing file"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		log.Printf("[UserHandler.ImportStudents] Cannot open file: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "cannot open file"})
		return
	}
	defer f.Close()

	rows, parseErrs := csv.ParseStudentsCSV(f) // []domain.NewStudent + []error
	log.Printf("[UserHandler.ImportStudents] CSV parsed - rows: %d, errors: %d", len(rows), len(parseErrs))

	if len(rows) == 0 && len(parseErrs) > 0 {
		log.Printf("[UserHandler.ImportStudents] CSV parse failed")
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "csv parse error", "details": parseErrs})
		return
	}

	dry := strings.EqualFold(ctx.Query("dryRun"), "true")

	res, err := h.svc.BulkUpsertStudents(ctx.Request.Context(), rows, userID, dry)
	if err != nil {
		log.Printf("[UserHandler.ImportStudents] Bulk upsert failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// include parse warnings, if any
	if len(parseErrs) > 0 {
		res.ParseWarnings = parseErrs
	}
	ctx.JSON(http.StatusOK, res)
}

// Add this method to user/handler.go

// GetStudents handles GET /admin/students
// It is used by the admin portal to populate the student list.
func (h *UserHandler) GetStudents(ctx *gin.Context) {
	log.Printf("[UserHandler.GetStudents] Retrieving student list")
	// 1) Admin-only check
	roles := ctx.MustGet("roles").([]string)

	if !slices.Contains(roles, "admin") {
		log.Printf("[UserHandler.GetStudents] Forbidden: user not admin")
		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// 2) Call service
	users, err := h.svc.ListStudents(ctx.Request.Context())
	if err != nil {
		log.Printf("[UserHandler.GetStudents] Failed to list students: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// 3) Map domain.User -> UserResponse DTO
	resp := make([]UserResponse, 0, len(users))
	for _, user := range users {
		resp = append(resp, UserResponse{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
			Taz:       user.Taz,
		})
	}

	// 4) Return JSON
	ctx.JSON(http.StatusOK, resp)
}
