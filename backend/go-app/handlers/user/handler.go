package user

import (
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

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
	profile, err := h.svc.GetProfileByID(ctx.Request.Context(), userID)
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
	resp := ProfileResponse{
		UserResponse: UserResponse{
			ID:        profile.User.ID,
			FirstName: profile.User.FirstName,
			LastName:  profile.User.LastName,
			Email:     profile.User.Email,
			Taz:       profile.User.Taz,
			Signature: profile.User.Signature,
			Roles:     profile.User.Roles,
		},
	}
	if profile.Class != nil {
		resp.Class = &ClassDTO{
			ID:                 profile.Class.ID,
			Name:               profile.Class.Name,
			ClientStartDate:    format.OptionalDate(profile.Class.ClientStartDate),
			MentorStartDate:    format.OptionalDate(profile.Class.MentorStartDate),
			TherapistStartDate: format.OptionalDate(profile.Class.TherapistStartDate),
		}
	}

	if profile.Class == nil {
		log.Printf("[UserHandler.GetMe] Retrieved user profile for user ID: %s, name: %s %s, email: %s, class=none", profile.User.ID, profile.User.FirstName, profile.User.LastName, profile.User.Email)
	} else {
		log.Printf("[UserHandler.GetMe] Retrieved user profile for user ID: %s, name: %s %s, email: %s, classID=%s, className=%q, clientStartDate=%v, mentorStartDate=%v, therapistStartDate=%v", profile.User.ID, profile.User.FirstName, profile.User.LastName, profile.User.Email, profile.Class.ID, profile.Class.Name, profile.Class.ClientStartDate, profile.Class.MentorStartDate, profile.Class.TherapistStartDate)
	}
	ctx.JSON(http.StatusOK, resp)
}

// ListClasses handles GET /admin/classes.
func (h *UserHandler) ListClasses(ctx *gin.Context) {
	if !requireAdmin(ctx) {
		return
	}
	classes, err := h.svc.ListClasses(ctx.Request.Context())
	if err != nil {
		log.Printf("[UserHandler.ListClasses] Failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	response := make([]AdminClassResponse, 0, len(classes))
	for _, class := range classes {
		response = append(response, mapAdminClass(class))
	}
	ctx.JSON(http.StatusOK, response)
}

// CreateClass handles POST /admin/classes.
func (h *UserHandler) CreateClass(ctx *gin.Context) {
	if !requireAdmin(ctx) {
		return
	}
	class, ok := populateClassCreationRequest(ctx)
	if !ok {
		return
	}
	created, err := h.svc.CreateClass(ctx.Request.Context(), class)
	if !writeAdminClassError(ctx, err) {
		return
	}
	ctx.JSON(http.StatusCreated, mapAdminClass(created))
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

	if !requireAdmin(ctx) {
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

// POST /admin/classes/:classId/students/import
func (h *UserHandler) ImportStudents(ctx *gin.Context) {
	log.Printf("[UserHandler.ImportStudents] Importing students from CSV")
	userID := ctx.MustGet("userID").(uuid.UUID)

	if !requireAdmin(ctx) {
		return
	}
	classID, err := uuid.Parse(ctx.Param("classId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid class ID"})
		return
	}
	if _, err := h.svc.GetClassByID(ctx.Request.Context(), classID); err != nil {
		var notFound service.NotFoundError
		if errors.As(err, &notFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
			return
		}
		log.Printf("[UserHandler.ImportStudents] Failed to validate class %s: %v", classID, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
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
	for i := range rows {
		rows[i].ClassID = classID
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
	if !requireAdmin(ctx) {
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

func requireAdmin(ctx *gin.Context) bool {
	if slices.Contains(ctx.MustGet("roles").([]string), "admin") {
		return true
	}
	ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	return false
}

func populateClassCreationRequest(ctx *gin.Context) (domain.Class, bool) {
	var request AdminClassRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid class payload"})
		return domain.Class{}, false
	}
	clientStartDate, err := parseOptionalDate(request.ReportingStartDates.Client)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid client start date"})
		return domain.Class{}, false
	}
	mentorStartDate, err := parseOptionalDate(request.ReportingStartDates.Mentor)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid mentor start date"})
		return domain.Class{}, false
	}
	therapistStartDate, err := parseOptionalDate(request.ReportingStartDates.Therapist)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid therapist start date"})
		return domain.Class{}, false
	}
	if clientStartDate == nil || mentorStartDate == nil || therapistStartDate == nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "all reporting start dates are required"})
		return domain.Class{}, false
	}
	return domain.Class{
		Name:               request.Name,
		ClientStartDate:    clientStartDate,
		MentorStartDate:    mentorStartDate,
		TherapistStartDate: therapistStartDate,
	}, true
}

func parseOptionalDate(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}
	date, err := time.Parse(format.ISODate, *value)
	if err != nil {
		return nil, err
	}
	return &date, nil
}

func mapAdminClass(class domain.Class) AdminClassResponse {
	return AdminClassResponse{
		ID:   class.ID,
		Name: class.Name,
		ReportingStartDates: ReportingStartDatesDTO{
			Client:    format.OptionalDate(class.ClientStartDate),
			Mentor:    format.OptionalDate(class.MentorStartDate),
			Therapist: format.OptionalDate(class.TherapistStartDate),
		},
	}
}

func writeAdminClassError(ctx *gin.Context, err error) bool {
	if err == nil {
		return true
	}
	var validationError service.ValidationError
	var alreadyExistsError service.AlreadyExistsError
	switch {
	case errors.As(err, &validationError):
		ctx.JSON(http.StatusBadRequest, gin.H{"error": validationError.Error()})
	case errors.As(err, &alreadyExistsError):
		ctx.JSON(http.StatusConflict, gin.H{"error": alreadyExistsError.Error()})
	default:
		log.Printf("[UserHandler.Class] Failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
	}
	return false
}
