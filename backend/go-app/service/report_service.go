package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

const (
	DefaultReportStudentLimit = 50
	MaxReportStudentLimit     = 100
)

type ReportService struct {
	reportRepo  repository.ReportRepo
	userRepo    repository.UserRepo
	contactRepo repository.ContactRepo
}

func NewReportService(
	reportRepo repository.ReportRepo,
	userRepo repository.UserRepo,
	contactRepo repository.ContactRepo,
) *ReportService {
	return &ReportService{
		reportRepo:  reportRepo,
		userRepo:    userRepo,
		contactRepo: contactRepo,
	}
}

func (s *ReportService) SearchStudents(
	ctx context.Context,
	query string,
	classFilter string,
	sortBy string,
	sortDirection string,
	page int,
	limit int,
) (domain.StudentSearchPage, error) {
	query = strings.TrimSpace(query)
	classFilter = strings.TrimSpace(classFilter)
	sortBy = strings.ToLower(strings.TrimSpace(sortBy))
	sortDirection = strings.ToLower(strings.TrimSpace(sortDirection))
	if sortBy == "" {
		sortBy = "name"
	}
	if sortDirection == "" {
		sortDirection = "asc"
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = DefaultReportStudentLimit
	}
	if limit > MaxReportStudentLimit {
		limit = MaxReportStudentLimit
	}

	students, total, err := s.reportRepo.SearchStudentSummaries(ctx, query, classFilter, sortBy, sortDirection, limit, (page-1)*limit)
	if err != nil {
		return domain.StudentSearchPage{}, DBError{fmt.Errorf("search students for reports: %w", err)}
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return domain.StudentSearchPage{
		Students:   students,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *ReportService) ListStudentClasses(ctx context.Context) ([]string, error) {
	classes, err := s.reportRepo.ListStudentClasses(ctx)
	if err != nil {
		return nil, DBError{fmt.Errorf("list student classes for reports: %w", err)}
	}
	return classes, nil
}

func (s *ReportService) SearchMentors(
	ctx context.Context,
	query string,
	sortBy string,
	sortDirection string,
	page int,
	limit int,
) (domain.MentorSearchPage, error) {
	query = strings.TrimSpace(query)
	sortBy = strings.ToLower(strings.TrimSpace(sortBy))
	sortDirection = strings.ToLower(strings.TrimSpace(sortDirection))
	if sortBy == "" {
		sortBy = "name"
	}
	if sortDirection == "" {
		sortDirection = "asc"
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = DefaultReportStudentLimit
	}
	if limit > MaxReportStudentLimit {
		limit = MaxReportStudentLimit
	}

	mentors, total, err := s.reportRepo.SearchMentorSummaries(ctx, query, sortBy, sortDirection, limit, (page-1)*limit)
	if err != nil {
		return domain.MentorSearchPage{}, DBError{fmt.Errorf("search mentors for reports: %w", err)}
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return domain.MentorSearchPage{
		Mentors:    mentors,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *ReportService) GetMentorReport(
	ctx context.Context,
	mentorID uuid.UUID,
) (domain.MentorReport, error) {
	mentor, err := s.userRepo.FindByID(ctx, mentorID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.MentorReport{}, NotFoundError{"mentor", mentorID.String()}
		}
		return domain.MentorReport{}, DBError{fmt.Errorf("find report mentor: %w", err)}
	}
	if !hasRole(mentor.Roles, "mentor") {
		return domain.MentorReport{}, NotFoundError{"mentor", mentorID.String()}
	}

	students, err := s.reportRepo.ListMentorStudents(ctx, mentorID)
	if err != nil {
		return domain.MentorReport{}, DBError{fmt.Errorf("list mentor report students: %w", err)}
	}
	events, err := s.reportRepo.ListMentorEvents(ctx, mentorID)
	if err != nil {
		return domain.MentorReport{}, DBError{fmt.Errorf("list mentor report events: %w", err)}
	}

	summary := domain.MentorSummary{
		ID:                 mentor.ID,
		FirstName:          mentor.FirstName,
		LastName:           mentor.LastName,
		Email:              mentor.Email,
		SignatureSubmitted: len(mentor.Signature) > 0,
		StudentCount:       int64(len(students)),
	}
	for _, student := range students {
		summary.SubmittedHours.Approved += student.SubmittedHours.Approved
		summary.SubmittedHours.Pending += student.SubmittedHours.Pending
	}

	return domain.MentorReport{
		Mentor:   summary,
		Students: students,
		Events:   events,
	}, nil
}

func (s *ReportService) GetStudentReport(
	ctx context.Context,
	studentID uuid.UUID,
) (domain.StudentReport, error) {
	student, err := s.userRepo.FindByID(ctx, studentID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.StudentReport{}, NotFoundError{"student", studentID.String()}
		}
		return domain.StudentReport{}, DBError{fmt.Errorf("find report student: %w", err)}
	}
	if !hasRole(student.Roles, "student") {
		return domain.StudentReport{}, NotFoundError{"student", studentID.String()}
	}

	events, err := s.reportRepo.ListStudentEvents(ctx, studentID)
	if err != nil {
		return domain.StudentReport{}, DBError{err}
	}
	manualEntries, err := s.reportRepo.ListStudentManualEntries(ctx, studentID)
	if err != nil {
		return domain.StudentReport{}, DBError{err}
	}
	contacts, err := s.contactRepo.ListByUser(ctx, studentID)
	if err != nil {
		return domain.StudentReport{}, DBError{fmt.Errorf("list student report contacts: %w", err)}
	}

	summary := domain.StudentReportSummary{}
	summary.SignatureSubmitted = len(student.Signature) > 0
	contactReports := make([]domain.ReportContact, 0, len(contacts))
	contactIndex := make(map[uuid.UUID]int, len(contacts))
	for _, contact := range contacts {
		contactIndex[contact.ID] = len(contactReports)
		contactReports = append(contactReports, domain.ReportContact{
			ID:                       contact.ID,
			Type:                     contact.Type,
			Name:                     contact.Name,
			Email:                    optionalString(contact.Email),
			Phone:                    optionalString(contact.Phone),
			Specialty:                optionalString(contact.Specialty),
			ClientInstitution:        optionalString(contact.ClientInstitution),
			ClientTrainingCenterInfo: optionalString(contact.ClientTrainingCenterInfo),
		})
	}

	for i := range events {
		events[i].Hours = 1
		summary.LastReportedDate = latestDate(summary.LastReportedDate, &events[i].Date)
		switch events[i].Category {
		case domain.ClientContact:
			summary.ClientHours++
		case domain.MentorContact:
			if events[i].Approved {
				summary.MentorApprovedHours++
			} else {
				summary.MentorPendingHours++
			}
		case domain.TherapistContact:
			summary.TherapistHours++
		}

		if contactPos, ok := contactIndex[events[i].ContactID]; ok {
			contactReports[contactPos].Hours++
			if events[i].Category == domain.MentorContact {
				if events[i].Approved {
					contactReports[contactPos].ApprovedHours++
				} else {
					contactReports[contactPos].PendingHours++
				}
			}
		}
	}

	for _, manual := range manualEntries {
		summary.ManualHours += manual.Hours
		switch manual.Type {
		case domain.ClientContact:
			summary.ManualHoursByCategory.Client += manual.Hours
		case domain.MentorContact:
			summary.ManualHoursByCategory.Mentor += manual.Hours
		case domain.TherapistContact:
			summary.ManualHoursByCategory.Therapist += manual.Hours
		}
	}

	studentClass := ""
	if student.ClassID != nil {
		class, err := s.userRepo.FindClassByID(ctx, *student.ClassID)
		if err != nil {
			return domain.StudentReport{}, DBError{fmt.Errorf("find report student class: %w", err)}
		}
		studentClass = class.Name
	}
	studentSummary := domain.StudentSummary{
		ID:        student.ID,
		FirstName: student.FirstName,
		LastName:  student.LastName,
		Email:     student.Email,
		Class:     studentClass,
		Taz:       student.Taz,
		Summary:   summary,
	}

	return domain.StudentReport{
		Student:       studentSummary,
		Events:        events,
		ManualEntries: manualEntries,
		Contacts:      contactReports,
	}, nil
}

func hasRole(roles []string, wanted string) bool {
	for _, role := range roles {
		if role == wanted {
			return true
		}
	}
	return false
}

func optionalString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func latestDate(current, candidate *time.Time) *time.Time {
	if candidate == nil {
		return current
	}
	if current == nil || candidate.After(*current) {
		copy := *candidate
		return &copy
	}
	return current
}
