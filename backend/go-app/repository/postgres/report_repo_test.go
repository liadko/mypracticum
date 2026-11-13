package postgres

import (
	"context"
	"errors"
	"testing"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func TestStudentSummaryTotals(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	class := seedClass(t, "Class A")
	student := seedUser(t, "s@x.co", "student", &class)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	entries := NewPostgresEntryRepo(testDB)

	mc := createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))
	cc := createContact(t, clientContact(student, "A.B", "privateClinic"))
	tc := createContact(t, domain.Contact{UserID: student, Type: domain.TherapistContact, Name: "Tal", Phone: strptr("050")})

	approved := addEntry(t, student, mc.ID, "2025-01-01")
	addEntry(t, student, mc.ID, "2025-01-02")
	addEntry(t, student, cc.ID, "2025-01-03")
	addEntry(t, student, cc.ID, "2025-01-04")
	addEntry(t, student, tc.ID, "2025-01-05")
	if _, err := entries.UpdateApproval(ctx, approved.ID, &mentor); err != nil {
		t.Fatal(err)
	}
	if _, err := entries.CreateManualEntry(ctx, domain.NewManualEntry{UserID: student, Hours: 30, Cause: "summary", Type: "client"}); err != nil {
		t.Fatal(err)
	}
	if _, err := entries.CreateManualEntry(ctx, domain.NewManualEntry{UserID: student, Hours: 7, Cause: "summary", Type: "mentor"}); err != nil {
		t.Fatal(err)
	}

	got, total, err := NewPostgresReportRepo(testDB).SearchStudentSummaries(ctx, "", "", "name", "asc", domain.ListAllStudents, false, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || len(got) != 1 {
		t.Fatalf("total=%d rows=%d", total, len(got))
	}
	s := got[0].Summary
	if got[0].Class != "Class A" {
		t.Errorf("class = %q", got[0].Class)
	}
	if s.ClientHours != 2 || s.MentorApprovedHours != 1 || s.MentorPendingHours != 1 || s.TherapistHours != 1 {
		t.Errorf("regular totals wrong: %+v", s)
	}
	if s.ManualHours != 37 || s.ManualHoursByCategory.Client != 30 || s.ManualHoursByCategory.Mentor != 7 {
		t.Errorf("manual totals wrong: %+v", s)
	}
	if s.LastReportedDate == nil || s.LastReportedDate.Format("2006-01-02") != "2025-01-05" {
		t.Errorf("last reported = %v", s.LastReportedDate)
	}
}

func TestStudentSummaryFilters(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	a := seedClass(t, "Class A")
	b := seedClass(t, "Class B")
	seedUser(t, "alpha@x.co", "student", &a)
	seedUser(t, "beta@x.co", "student", &b)
	seedUser(t, "mentor@x.co", "mentor", nil)
	repo := NewPostgresReportRepo(testDB)

	if _, total, err := repo.SearchStudentSummaries(ctx, "", "", "name", "asc", domain.ListAllStudents, false, 50, 0); err != nil || total != 2 {
		t.Fatalf("mentors must not be listed as students: total=%d err=%v", total, err)
	}
	if got, total, err := repo.SearchStudentSummaries(ctx, "", "Class B", "name", "asc", domain.ListAllStudents, false, 50, 0); err != nil || total != 1 || got[0].Email != "beta@x.co" {
		t.Fatalf("class filter: total=%d err=%v", total, err)
	}
	if got, total, err := repo.SearchStudentSummaries(ctx, "alpha", "", "name", "asc", domain.ListAllStudents, false, 50, 0); err != nil || total != 1 || got[0].Email != "alpha@x.co" {
		t.Fatalf("query filter: total=%d err=%v", total, err)
	}
}

func TestPrivateClinicHoursAndOverCapFilter(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	classID := seedClass(t, "Class A")
	if _, err := testDB.Exec(`UPDATE classes SET private_clinic_cap = 1 WHERE id = $1`, classID); err != nil {
		t.Fatal(err)
	}
	over := seedUser(t, "over@x.co", "student", &classID)
	under := seedUser(t, "under@x.co", "student", &classID)

	c := createContact(t, clientContact(over, "A.B", "privateClinic"))
	addEntry(t, over, c.ID, "2025-01-10")
	addEntry(t, over, c.ID, "2025-01-11")
	d := createContact(t, clientContact(under, "C.D", "privateClinic"))
	addEntry(t, under, d.ID, "2025-01-10")

	repo := NewPostgresReportRepo(testDB)
	got, total, err := repo.SearchStudentSummaries(ctx, "", "", "privateclinichours", "desc", domain.ListAllStudents, false, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 2 || got[0].Email != "over@x.co" || got[0].Summary.PrivateClinicHours != 2 || got[0].Summary.PrivateClinicCap != 1 {
		t.Fatalf("got %+v", got)
	}

	got, total, err = repo.SearchStudentSummaries(ctx, "", "", "name", "asc", domain.ListAllStudents, true, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || got[0].Email != "over@x.co" {
		t.Fatalf("over-cap filter: total=%d rows=%+v (at the cap is not over)", total, got)
	}
}

func TestClassPrivateClinicCap(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresUserRepo(testDB)

	created, err := repo.CreateClass(ctx, domain.Class{Name: "Class B", PrivateClinicCap: domain.DefaultPrivateClinicCap})
	if err != nil {
		t.Fatal(err)
	}
	if created.PrivateClinicCap != 160 {
		t.Fatalf("got %d", created.PrivateClinicCap)
	}
	updated, err := repo.UpdateClassPrivateClinicCap(ctx, created.ID, 200)
	if err != nil || updated.PrivateClinicCap != 200 {
		t.Fatalf("got %+v, %v", updated, err)
	}
	if _, err := repo.UpdateClassPrivateClinicCap(ctx, uuid.New(), 10); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("unknown class: got %v", err)
	}
	if _, err := repo.UpdateClassPrivateClinicCap(ctx, created.ID, -1); err == nil {
		t.Fatal("a negative cap must be rejected by the database")
	}
}

func TestStudentSummaryRejectsUnknownSort(t *testing.T) {
	resetDB(t)
	_, _, err := NewPostgresReportRepo(testDB).SearchStudentSummaries(context.Background(), "", "", "1; DROP TABLE users", "asc", domain.ListAllStudents, false, 50, 0)
	if err == nil {
		t.Fatal("unknown sort field must be rejected, it is concatenated into SQL")
	}
}
