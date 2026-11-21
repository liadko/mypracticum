package user

import (
	"errors"
	"net/http"

	"mypracticum/backend/domain"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ClassReportingDatesRequest struct {
	ReportingStartDates *ReportingStartDatesDTO `json:"reportingStartDates" binding:"required"`
}

func (h *UserHandler) UpdateClassReportingStartDates(ctx *gin.Context) {
	if !requireAdmin(ctx) {
		return
	}
	id, err := uuid.Parse(ctx.Param("classId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid class ID"})
		return
	}
	var req ClassReportingDatesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "reportingStartDates is required"})
		return
	}
	client, clientErr := parseOptionalDate(req.ReportingStartDates.Client)
	mentor, mentorErr := parseOptionalDate(req.ReportingStartDates.Mentor)
	therapist, therapistErr := parseOptionalDate(req.ReportingStartDates.Therapist)
	if clientErr != nil || mentorErr != nil || therapistErr != nil || client == nil || mentor == nil || therapist == nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "all three reporting start dates must be valid YYYY-MM-DD dates"})
		return
	}
	class, err := h.svc.UpdateClassReportingStartDates(ctx.Request.Context(), id, domain.Class{ClientStartDate: client, MentorStartDate: mentor, TherapistStartDate: therapist})
	var notFound service.NotFoundError
	if errors.As(err, &notFound) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": notFound.Error()})
		return
	}
	if !writeAdminClassError(ctx, err) {
		return
	}
	ctx.JSON(http.StatusOK, mapAdminClass(class))
}
