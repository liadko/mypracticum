package report

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/format"
	"mypracticum/backend/repository"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

// ListStudents handles GET /reports/students?query=...&class=...&sortBy=name&sortDirection=asc&page=1&limit=50.
func (h *ReportHandler) ListStudents(ctx *gin.Context) {
	page := 1
	if raw := ctx.Query("page"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "page must be an integer"})
			return
		}
		page = parsed
	}

	limit := 0
	if raw := ctx.Query("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "limit must be an integer"})
			return
		}
		limit = parsed
	}
	log.Printf("[reports] students start page=%d limit=%d sort=%s/%s query=%t class=%t", page, limit, ctx.Query("sortBy"), ctx.Query("sortDirection"), ctx.Query("query") != "", ctx.Query("class") != "")

	result, err := h.svc.SearchStudents(
		ctx.Request.Context(),
		ctx.Query("query"),
		ctx.Query("class"),
		ctx.Query("sortBy"),
		ctx.Query("sortDirection"),
		page,
		limit,
	)
	if err != nil {
		log.Printf("[reports] students failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list report students"})
		return
	}

	response := make([]StudentSummaryResponse, 0, len(result.Students))
	for _, student := range result.Students {
		response = append(response, mapStudentSummary(student))
	}
	ctx.JSON(http.StatusOK, gin.H{
		"students":   response,
		"total":      result.Total,
		"page":       result.Page,
		"limit":      result.Limit,
		"totalPages": result.TotalPages,
	})
	log.Printf("[reports] students ok returned=%d total=%d page=%d/%d", len(result.Students), result.Total, result.Page, result.TotalPages)
}

// ListClasses handles GET /reports/classes.
func (h *ReportHandler) ListClasses(ctx *gin.Context) {
	classes, err := h.svc.ListStudentClasses(ctx.Request.Context())
	if err != nil {
		log.Printf("[reports] classes failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list report classes"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"classes": classes})
	log.Printf("[reports] classes ok returned=%d", len(classes))
}

// ListMentors handles GET /reports/mentors?query=...&sortBy=name&sortDirection=asc&page=1&limit=50.
func (h *ReportHandler) ListMentors(ctx *gin.Context) {
	page, limit, err := parseReportPagination(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.SearchMentors(
		ctx.Request.Context(),
		ctx.Query("query"),
		ctx.Query("sortBy"),
		ctx.Query("sortDirection"),
		page,
		limit,
	)
	if err != nil {
		log.Printf("[reports] mentors failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list report mentors"})
		return
	}

	mentors := make([]MentorSummaryResponse, 0, len(result.Mentors))
	for _, mentor := range result.Mentors {
		mentors = append(mentors, mapMentorSummary(mentor))
	}
	ctx.JSON(http.StatusOK, MentorListResponse{
		Mentors:    mentors,
		Total:      result.Total,
		Page:       result.Page,
		Limit:      result.Limit,
		TotalPages: result.TotalPages,
	})
	log.Printf("[reports] mentors ok returned=%d total=%d page=%d/%d", len(mentors), result.Total, result.Page, result.TotalPages)
}

// GetMentor handles GET /reports/mentors/:mentorId.
func (h *ReportHandler) GetMentor(ctx *gin.Context) {
	mentorID, err := uuid.Parse(ctx.Param("mentorId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid mentor id"})
		return
	}

	report, err := h.svc.GetMentorReport(ctx.Request.Context(), mentorID)
	if err != nil {
		var notFound service.NotFoundError
		if errors.As(err, &notFound) || errors.Is(err, repository.ErrNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "mentor not found"})
			return
		}
		log.Printf("[reports] mentor failed id=%s: %v", mentorID, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load mentor report"})
		return
	}

	ctx.JSON(http.StatusOK, mapMentorReport(report))
	log.Printf("[reports] mentor ok id=%s students=%d events=%d", mentorID, len(report.Students), len(report.Events))
}

func parseReportPagination(ctx *gin.Context) (int, int, error) {
	page := 1
	if raw := ctx.Query("page"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			return 0, 0, errors.New("page must be an integer")
		}
		page = parsed
	}

	limit := 0
	if raw := ctx.Query("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			return 0, 0, errors.New("limit must be an integer")
		}
		limit = parsed
	}
	return page, limit, nil
}

// GetStudent handles GET /reports/students/:studentId.
func (h *ReportHandler) GetStudent(ctx *gin.Context) {
	studentID, err := uuid.Parse(ctx.Param("studentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}
	log.Printf("[reports] student start id=%s", studentID)

	report, err := h.svc.GetStudentReport(ctx.Request.Context(), studentID)
	if err != nil {
		var notFound service.NotFoundError
		if errors.As(err, &notFound) || errors.Is(err, repository.ErrNotFound) {
			log.Printf("[reports] student not_found id=%s", studentID)
			ctx.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
			return
		}
		log.Printf("[reports] student failed id=%s: %v", studentID, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load student report"})
		return
	}

	ctx.JSON(http.StatusOK, mapStudentReport(report))
	log.Printf("[reports] student ok id=%s events=%d manual=%d contacts=%d", studentID, len(report.Events), len(report.ManualEntries), len(report.Contacts))
}

func mapStudentSummary(student domain.StudentSummary) StudentSummaryResponse {
	return StudentSummaryResponse{
		ID:        student.ID,
		FirstName: student.FirstName,
		LastName:  student.LastName,
		Email:     student.Email,
		Class:     student.Class,
		Taz:       student.Taz,
		Summary:   mapSummary(student.Summary),
	}
}

func mapMentorSummary(mentor domain.MentorSummary) MentorSummaryResponse {
	response := MentorSummaryResponse{
		ID:                 mentor.ID,
		FirstName:          mentor.FirstName,
		LastName:           mentor.LastName,
		Email:              mentor.Email,
		SignatureSubmitted: mentor.SignatureSubmitted,
		StudentCount:       mentor.StudentCount,
		SubmittedHours: MentorHoursResponse{
			MentorApproved: mentor.SubmittedHours.Approved,
			MentorPending:  mentor.SubmittedHours.Pending,
		},
	}
	response.Students = make([]MentorStudentReferenceResponse, 0, len(mentor.Students))
	for _, student := range mentor.Students {
		response.Students = append(response.Students, MentorStudentReferenceResponse{
			ID:        student.ID,
			FirstName: student.FirstName,
			LastName:  student.LastName,
		})
	}
	return response
}

func mapMentorReport(report domain.MentorReport) MentorReportResponse {
	response := MentorReportResponse{
		Mentor:   mapMentorSummary(report.Mentor),
		Students: make([]MentorStudentResponse, 0, len(report.Students)),
		Events:   make([]MentorEventResponse, 0, len(report.Events)),
	}
	for _, student := range report.Students {
		response.Students = append(response.Students, MentorStudentResponse{
			ID:        student.ID,
			FirstName: student.FirstName,
			LastName:  student.LastName,
			Email:     student.Email,
			Class:     student.Class,
			Taz:       student.Taz,
			SubmittedHours: MentorHoursResponse{
				MentorApproved: student.SubmittedHours.Approved,
				MentorPending:  student.SubmittedHours.Pending,
			},
		})
	}
	for _, event := range report.Events {
		response.Events = append(response.Events, MentorEventResponse{
			ID:              event.ID,
			Date:            format.Date(event.Date),
			StudentID:       event.StudentID,
			StudentName:     event.StudentName,
			StudentClass:    event.StudentClass,
			MentorContactID: event.MentorContactID,
			Approved:        event.Approved,
			Hours:           event.Hours,
			Source:          event.Source,
		})
	}
	return response
}

func mapSummary(summary domain.StudentReportSummary) Summary {
	lastReportedDate := ""
	if summary.LastReportedDate != nil {
		lastReportedDate = format.Date(*summary.LastReportedDate)
	}
	return Summary{
		SubmittedHours: SubmittedHours{
			Client:         summary.ClientHours,
			MentorApproved: summary.MentorApprovedHours,
			MentorPending:  summary.MentorPendingHours,
			Therapist:      summary.TherapistHours,
		},
		ManualHours: ManualHours{
			Client:    summary.ManualHoursByCategory.Client,
			Mentor:    summary.ManualHoursByCategory.Mentor,
			Therapist: summary.ManualHoursByCategory.Therapist,
		},
		LastReportedDate:   lastReportedDate,
		SignatureSubmitted: summary.SignatureSubmitted,
	}
}

func mapStudentReport(report domain.StudentReport) StudentReportResponse {
	response := StudentReportResponse{
		Student:       mapStudentSummary(report.Student),
		Events:        make([]ReportEventResponse, 0, len(report.Events)),
		ManualEntries: make([]ManualEntryResponse, 0, len(report.ManualEntries)),
		Contacts: ContactsResponse{
			Mentors:    make([]ContactResponse, 0),
			Clients:    make([]ContactResponse, 0),
			Therapists: make([]ContactResponse, 0),
		},
	}

	for _, event := range report.Events {
		response.Events = append(response.Events, ReportEventResponse{
			ID:          event.ID,
			Date:        format.Date(event.Date),
			Category:    string(event.Category),
			ContactID:   event.ContactID,
			ContactName: event.ContactName,
			Approved:    event.Approved,
			Hours:       event.Hours,
			Source:      event.Source,
		})
	}

	for _, entry := range report.ManualEntries {
		response.ManualEntries = append(response.ManualEntries, ManualEntryResponse{
			ID:        entry.ID,
			Hours:     entry.Hours,
			Title:     entry.Cause,
			Category:  string(entry.Type),
			CreatedAt: entry.CreatedAt,
			BatchID:   entry.BatchID,
		})
	}

	for _, contact := range report.Contacts {
		mapped := ContactResponse{
			ID:                       contact.ID,
			Type:                     string(contact.Type),
			Name:                     contact.Name,
			Email:                    contact.Email,
			Phone:                    contact.Phone,
			Specialty:                contact.Specialty,
			ClientInstitution:        contact.ClientInstitution,
			ClientTrainingCenterInfo: contact.ClientTrainingCenterInfo,
			Hours:                    contact.Hours,
			ApprovedHours:            contact.ApprovedHours,
			PendingHours:             contact.PendingHours,
		}
		switch contact.Type {
		case domain.MentorContact:
			response.Contacts.Mentors = append(response.Contacts.Mentors, mapped)
		case domain.ClientContact:
			response.Contacts.Clients = append(response.Contacts.Clients, mapped)
		case domain.TherapistContact:
			response.Contacts.Therapists = append(response.Contacts.Therapists, mapped)
		}
	}

	return response
}
