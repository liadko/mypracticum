package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

type PostgresReportRepo struct {
	db *sql.DB
}

func NewPostgresReportRepo(db *sql.DB) repository.ReportRepo {
	return &PostgresReportRepo{db: db}
}

func (r *PostgresReportRepo) SearchStudentSummaries(
	ctx context.Context,
	query string,
	classFilter string,
	sortBy string,
	sortDirection string,
	limit int,
	offset int,
) ([]domain.StudentSummary, int64, error) {
	orderBy, ok := reportStudentSortExpression(sortBy)
	if !ok {
		return nil, 0, fmt.Errorf("invalid report student sort field %q", sortBy)
	}
	if sortDirection != "asc" && sortDirection != "desc" {
		return nil, 0, fmt.Errorf("invalid report student sort direction %q", sortDirection)
	}

	direction := strings.ToUpper(sortDirection)
	nameLanguageOrder := ""
	if sortBy == "name" {
		nameLanguageOrder = "CASE WHEN concat_ws(' ', s.first_name, s.last_name) ~ '[א-ת]' THEN 0 ELSE 1 END ASC,"
	}
	const countQ = `
SELECT COUNT(*)
  FROM users u
  LEFT JOIN classes cl ON cl.id = u.class_id
  JOIN user_roles ur ON ur.user_id = u.id
  JOIN roles ro ON ro.id = ur.role_id AND ro.name = 'student'
 WHERE ($1 = ''
    OR concat_ws(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR COALESCE(u.taz, '') ILIKE '%' || $1 || '%')
	AND ($2 = '' OR COALESCE(cl.name, '') = $2)
`

	var total int64
	if err := r.db.QueryRowContext(ctx, countQ, strings.TrimSpace(query), strings.TrimSpace(classFilter)).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count report students: %w", err)
	}

	q := `
WITH students AS (
    SELECT u.id, u.first_name, u.last_name, u.email, cl.name AS class, u.taz,
           (u.signature IS NOT NULL AND octet_length(u.signature) > 0) AS signature_submitted
      FROM users u
      LEFT JOIN classes cl ON cl.id = u.class_id
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles ro ON ro.id = ur.role_id AND ro.name = 'student'
     WHERE ($1 = ''
        OR concat_ws(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%'
        OR u.email ILIKE '%' || $1 || '%'
        OR COALESCE(u.taz, '') ILIKE '%' || $1 || '%')
	   AND ($2 = '' OR COALESCE(cl.name, '') = $2)
), regular AS (
    SELECT
        e.user_id,
        COUNT(*) FILTER (WHERE c.type = 'client') AS client_hours,
        COUNT(*) FILTER (WHERE c.type = 'mentor' AND e.approver_id IS NOT NULL) AS mentor_approved_hours,
        COUNT(*) FILTER (WHERE c.type = 'mentor' AND e.approver_id IS NULL) AS mentor_pending_hours,
        COUNT(*) FILTER (WHERE c.type = 'therapist') AS therapist_hours,
        COUNT(*) AS total_hours,
        MAX(e.date) AS last_reported_date
      FROM entries e
      JOIN contacts c ON c.id = e.contact_id
     GROUP BY e.user_id
), manual AS (
    SELECT
        me.user_id,
        COALESCE(SUM(me.hours), 0) AS manual_hours,
        COALESCE(SUM(me.hours) FILTER (WHERE me.type = 'client'), 0) AS manual_client_hours,
        COALESCE(SUM(me.hours) FILTER (WHERE me.type = 'mentor'), 0) AS manual_mentor_hours,
        COALESCE(SUM(me.hours) FILTER (WHERE me.type = 'therapist'), 0) AS manual_therapist_hours
      FROM manual_entries me
     GROUP BY me.user_id
)
SELECT
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    COALESCE(s.class, ''),
    COALESCE(s.taz, ''),
    COALESCE(r.client_hours, 0),
    COALESCE(r.mentor_approved_hours, 0),
    COALESCE(r.mentor_pending_hours, 0),
    COALESCE(r.therapist_hours, 0),
    COALESCE(m.manual_hours, 0),
    COALESCE(m.manual_client_hours, 0),
    COALESCE(m.manual_mentor_hours, 0),
    COALESCE(m.manual_therapist_hours, 0),
    r.last_reported_date,
    s.signature_submitted
  FROM students s
  LEFT JOIN regular r ON r.user_id = s.id
  LEFT JOIN manual m ON m.user_id = s.id
 ORDER BY ` + nameLanguageOrder + ` ` + orderBy + ` ` + direction + `, s.id
 LIMIT $3 OFFSET $4
`

	rows, err := r.db.QueryContext(ctx, q, strings.TrimSpace(query), strings.TrimSpace(classFilter), limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("search student report summaries: %w", err)
	}
	defer rows.Close()

	var out []domain.StudentSummary
	for rows.Next() {
		var s domain.StudentSummary
		var lastReported sql.NullTime
		if err := rows.Scan(
			&s.ID,
			&s.FirstName,
			&s.LastName,
			&s.Email,
			&s.Class,
			&s.Taz,
			&s.Summary.ClientHours,
			&s.Summary.MentorApprovedHours,
			&s.Summary.MentorPendingHours,
			&s.Summary.TherapistHours,
			&s.Summary.ManualHours,
			&s.Summary.ManualHoursByCategory.Client,
			&s.Summary.ManualHoursByCategory.Mentor,
			&s.Summary.ManualHoursByCategory.Therapist,
			&lastReported,
			&s.Summary.SignatureSubmitted,
		); err != nil {
			return nil, 0, fmt.Errorf("scan student report summary: %w", err)
		}
		if lastReported.Valid {
			s.Summary.LastReportedDate = &lastReported.Time
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate student report summaries: %w", err)
	}
	return out, total, nil
}

func (r *PostgresReportRepo) ListStudentClasses(ctx context.Context) ([]string, error) {
	const q = `
SELECT class_name
  FROM (
        SELECT DISTINCT cl.name AS class_name
          FROM users u
          JOIN classes cl ON cl.id = u.class_id
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles ro ON ro.id = ur.role_id AND ro.name = 'student'
       ) classes
 ORDER BY
   CASE WHEN class_name ~ '[א-ת]' THEN 0 ELSE 1 END,
   LOWER(class_name)
`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list student classes: %w", err)
	}
	defer rows.Close()

	classes := make([]string, 0)
	for rows.Next() {
		var className string
		if err := rows.Scan(&className); err != nil {
			return nil, fmt.Errorf("scan student class: %w", err)
		}
		classes = append(classes, className)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate student classes: %w", err)
	}
	return classes, nil
}

func (r *PostgresReportRepo) SearchMentorSummaries(
	ctx context.Context,
	query string,
	sortBy string,
	sortDirection string,
	limit int,
	offset int,
) ([]domain.MentorSummary, int64, error) {
	orderBy, ok := reportMentorSortExpression(sortBy)
	if !ok {
		return nil, 0, fmt.Errorf("invalid report mentor sort field %q", sortBy)
	}
	if sortDirection != "asc" && sortDirection != "desc" {
		return nil, 0, fmt.Errorf("invalid report mentor sort direction %q", sortDirection)
	}

	direction := strings.ToUpper(sortDirection)
	nameLanguageOrder := ""
	if sortBy == "name" {
		nameLanguageOrder = "CASE WHEN concat_ws(' ', u.first_name, u.last_name) ~ ('[' || chr(1488) || '-' || chr(1514) || ']') THEN 0 ELSE 1 END ASC,"
	}

	const countQ = `
SELECT COUNT(*)
  FROM users u
 WHERE EXISTS (
       SELECT 1
         FROM user_roles ur
         JOIN roles ro ON ro.id = ur.role_id
        WHERE ur.user_id = u.id
          AND ro.name = 'mentor'
 )
   AND (
        $1 = ''
        OR concat_ws(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%'
        OR u.email ILIKE '%' || $1 || '%'
   )
`

	var total int64
	if err := r.db.QueryRowContext(ctx, countQ, strings.TrimSpace(query)).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count report mentors: %w", err)
	}

	q := `
WITH mentor_stats AS (
    SELECT c.mentor_user_id,
           COUNT(DISTINCT c.user_id) AS student_count,
           COUNT(e.id) FILTER (WHERE e.approver_id IS NOT NULL) AS mentor_approved_hours,
           COUNT(e.id) FILTER (WHERE e.approver_id IS NULL) AS mentor_pending_hours
      FROM contacts c
      LEFT JOIN entries e ON e.contact_id = c.id
     WHERE c.type = 'mentor'
       AND c.mentor_user_id IS NOT NULL
     GROUP BY c.mentor_user_id
), mentor_students AS (
    SELECT links.mentor_user_id,
           jsonb_agg(
               jsonb_build_object(
                   'id', u.id,
                   'firstName', u.first_name,
                   'lastName', u.last_name
               )
               ORDER BY
                   CASE WHEN concat_ws(' ', u.first_name, u.last_name) ~ ('[' || chr(1488) || '-' || chr(1514) || ']') THEN 0 ELSE 1 END,
                   LOWER(concat_ws(' ', u.first_name, u.last_name)),
                   u.id
           ) AS students
      FROM (
            SELECT DISTINCT mentor_user_id, user_id
              FROM contacts
             WHERE type = 'mentor'
               AND mentor_user_id IS NOT NULL
           ) links
      JOIN users u ON u.id = links.user_id
     GROUP BY links.mentor_user_id
)
SELECT u.id,
       u.first_name,
       u.last_name,
       u.email,
       (u.signature IS NOT NULL AND octet_length(u.signature) > 0) AS signature_submitted,
       COALESCE(ms.student_count, 0),
       COALESCE(ms.mentor_approved_hours, 0),
       COALESCE(ms.mentor_pending_hours, 0),
       COALESCE(mstudents.students, '[]'::jsonb)
  FROM users u
  LEFT JOIN mentor_stats ms ON ms.mentor_user_id = u.id
  LEFT JOIN mentor_students mstudents ON mstudents.mentor_user_id = u.id
 WHERE EXISTS (
       SELECT 1
         FROM user_roles ur
         JOIN roles ro ON ro.id = ur.role_id
        WHERE ur.user_id = u.id
          AND ro.name = 'mentor'
 )
   AND (
        $1 = ''
        OR concat_ws(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%'
        OR u.email ILIKE '%' || $1 || '%'
   )
 ORDER BY ` + nameLanguageOrder + ` ` + orderBy + ` ` + direction + `, u.id
 LIMIT $2 OFFSET $3
`

	rows, err := r.db.QueryContext(ctx, q, strings.TrimSpace(query), limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("search report mentor summaries: %w", err)
	}
	defer rows.Close()

	mentors := make([]domain.MentorSummary, 0)
	for rows.Next() {
		var mentor domain.MentorSummary
		var studentsJSON []byte
		if err := rows.Scan(
			&mentor.ID,
			&mentor.FirstName,
			&mentor.LastName,
			&mentor.Email,
			&mentor.SignatureSubmitted,
			&mentor.StudentCount,
			&mentor.SubmittedHours.Approved,
			&mentor.SubmittedHours.Pending,
			&studentsJSON,
		); err != nil {
			return nil, 0, fmt.Errorf("scan report mentor summary: %w", err)
		}
		if err := json.Unmarshal(studentsJSON, &mentor.Students); err != nil {
			return nil, 0, fmt.Errorf("decode students for mentor summary: %w", err)
		}
		mentors = append(mentors, mentor)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate report mentor summaries: %w", err)
	}
	return mentors, total, nil
}

func (r *PostgresReportRepo) ListMentorStudents(ctx context.Context, mentorID uuid.UUID) ([]domain.MentorStudent, error) {
	const q = `
SELECT u.id,
       u.first_name,
       u.last_name,
       u.email,
       COALESCE(cl.name, ''),
       COALESCE(u.taz, ''),
       COUNT(e.id) FILTER (WHERE e.approver_id IS NOT NULL),
       COUNT(e.id) FILTER (WHERE e.approver_id IS NULL)
  FROM contacts c
  JOIN users u ON u.id = c.user_id
  LEFT JOIN classes cl ON cl.id = u.class_id
  LEFT JOIN entries e ON e.contact_id = c.id
 WHERE c.type = 'mentor'
   AND c.mentor_user_id = $1
 GROUP BY u.id, u.first_name, u.last_name, u.email, cl.name, u.taz
 ORDER BY
   CASE WHEN concat_ws(' ', u.first_name, u.last_name) ~ ('[' || chr(1488) || '-' || chr(1514) || ']') THEN 0 ELSE 1 END,
   LOWER(concat_ws(' ', u.first_name, u.last_name)),
   u.id
`

	rows, err := r.db.QueryContext(ctx, q, mentorID)
	if err != nil {
		return nil, fmt.Errorf("list students for mentor report: %w", err)
	}
	defer rows.Close()

	students := make([]domain.MentorStudent, 0)
	for rows.Next() {
		var student domain.MentorStudent
		if err := rows.Scan(
			&student.ID,
			&student.FirstName,
			&student.LastName,
			&student.Email,
			&student.Class,
			&student.Taz,
			&student.SubmittedHours.Approved,
			&student.SubmittedHours.Pending,
		); err != nil {
			return nil, fmt.Errorf("scan student for mentor report: %w", err)
		}
		students = append(students, student)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate students for mentor report: %w", err)
	}
	return students, nil
}

func (r *PostgresReportRepo) ListMentorEvents(ctx context.Context, mentorID uuid.UUID) ([]domain.MentorEvent, error) {
	const q = `
SELECT e.id,
       e.date,
       e.user_id,
       concat_ws(' ', u.first_name, u.last_name),
       COALESCE(cl.name, ''),
       c.id,
       (e.approver_id IS NOT NULL) AS approved
  FROM entries e
  JOIN contacts c ON c.id = e.contact_id
  JOIN users u ON u.id = e.user_id
  LEFT JOIN classes cl ON cl.id = u.class_id
 WHERE c.type = 'mentor'
   AND c.mentor_user_id = $1
 ORDER BY e.date DESC, e.id
`

	rows, err := r.db.QueryContext(ctx, q, mentorID)
	if err != nil {
		return nil, fmt.Errorf("list events for mentor report: %w", err)
	}
	defer rows.Close()

	events := make([]domain.MentorEvent, 0)
	for rows.Next() {
		var event domain.MentorEvent
		if err := rows.Scan(
			&event.ID,
			&event.Date,
			&event.StudentID,
			&event.StudentName,
			&event.StudentClass,
			&event.MentorContactID,
			&event.Approved,
		); err != nil {
			return nil, fmt.Errorf("scan event for mentor report: %w", err)
		}
		event.Hours = 1
		event.Source = "regular"
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate events for mentor report: %w", err)
	}
	return events, nil
}

func reportStudentSortExpression(sortBy string) (string, bool) {
	switch sortBy {
	case "name":
		return "LOWER(concat_ws(' ', s.first_name, s.last_name))", true
	case "class":
		return "LOWER(COALESCE(s.class, ''))", true
	case "email":
		return "LOWER(s.email)", true
	case "clienthours":
		return "COALESCE(r.client_hours, 0) + COALESCE(m.manual_client_hours, 0)", true
	case "mentorapprovedhours":
		return "COALESCE(r.mentor_approved_hours, 0) + COALESCE(m.manual_mentor_hours, 0)", true
	case "therapisthours":
		return "COALESCE(r.therapist_hours, 0) + COALESCE(m.manual_therapist_hours, 0)", true
	case "mentorpendinghours":
		return "COALESCE(r.mentor_pending_hours, 0)", true
	case "signaturesubmitted":
		return "s.signature_submitted", true
	default:
		return "", false
	}
}

func reportMentorSortExpression(sortBy string) (string, bool) {
	switch sortBy {
	case "name":
		return "LOWER(concat_ws(' ', u.first_name, u.last_name))", true
	case "email":
		return "LOWER(u.email)", true
	case "studentcount":
		return "COALESCE(ms.student_count, 0)", true
	case "mentorapprovedhours":
		return "COALESCE(ms.mentor_approved_hours, 0)", true
	case "mentorpendinghours":
		return "COALESCE(ms.mentor_pending_hours, 0)", true
	case "signaturesubmitted":
		return "(u.signature IS NOT NULL AND octet_length(u.signature) > 0)", true
	default:
		return "", false
	}
}

func (r *PostgresReportRepo) ListStudentEvents(
	ctx context.Context,
	studentID uuid.UUID,
) ([]domain.ReportEvent, error) {
	const q = `
SELECT e.id, e.date, c.type, c.id, c.name,
       (e.approver_id IS NOT NULL) AS approved
  FROM entries e
  JOIN contacts c ON c.id = e.contact_id
 WHERE e.user_id = $1
 ORDER BY e.date DESC, e.id
`

	rows, err := r.db.QueryContext(ctx, q, studentID)
	if err != nil {
		return nil, fmt.Errorf("list student report events: %w", err)
	}
	defer rows.Close()

	var out []domain.ReportEvent
	for rows.Next() {
		var event domain.ReportEvent
		if err := rows.Scan(
			&event.ID,
			&event.Date,
			&event.Category,
			&event.ContactID,
			&event.ContactName,
			&event.Approved,
		); err != nil {
			return nil, fmt.Errorf("scan student report event: %w", err)
		}
		event.Hours = 1
		event.Source = "regular"
		out = append(out, event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate student report events: %w", err)
	}
	return out, nil
}

func (r *PostgresReportRepo) ListStudentManualEntries(
	ctx context.Context,
	studentID uuid.UUID,
) ([]domain.ReportManualEntry, error) {
	const q = `
SELECT id, hours, cause, type, created_at, batch_id::text
  FROM manual_entries
 WHERE user_id = $1
 ORDER BY created_at DESC, id
`

	rows, err := r.db.QueryContext(ctx, q, studentID)
	if err != nil {
		return nil, fmt.Errorf("list student manual report entries: %w", err)
	}
	defer rows.Close()

	var out []domain.ReportManualEntry
	for rows.Next() {
		var entry domain.ReportManualEntry
		var batchID sql.NullString
		if err := rows.Scan(
			&entry.ID,
			&entry.Hours,
			&entry.Cause,
			&entry.Type,
			&entry.CreatedAt,
			&batchID,
		); err != nil {
			return nil, fmt.Errorf("scan student manual report entry: %w", err)
		}
		if batchID.Valid && batchID.String != "" {
			parsed, err := uuid.Parse(batchID.String)
			if err != nil {
				return nil, fmt.Errorf("parse manual entry batch id: %w", err)
			}
			entry.BatchID = &parsed
		}
		out = append(out, entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate student manual report entries: %w", err)
	}
	return out, nil
}
