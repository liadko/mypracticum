package postgres

import (
	"context"
	"testing"

	"mypracticum/backend/domain"
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

	got, total, err := NewPostgresReportRepo(testDB).SearchStudentSummaries(ctx, "", "", "name", "asc", true, 50, 0)
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

	if _, total, err := repo.SearchStudentSummaries(ctx, "", "", "name", "asc", true, 50, 0); err != nil || total != 2 {
		t.Fatalf("mentors must not be listed as students: total=%d err=%v", total, err)
	}
	if got, total, err := repo.SearchStudentSummaries(ctx, "", "Class B", "name", "asc", true, 50, 0); err != nil || total != 1 || got[0].Email != "beta@x.co" {
		t.Fatalf("class filter: total=%d err=%v", total, err)
	}
	if got, total, err := repo.SearchStudentSummaries(ctx, "alpha", "", "name", "asc", true, 50, 0); err != nil || total != 1 || got[0].Email != "alpha@x.co" {
		t.Fatalf("query filter: total=%d err=%v", total, err)
	}
}

func TestStudentSummaryRejectsUnknownSort(t *testing.T) {
	resetDB(t)
	_, _, err := NewPostgresReportRepo(testDB).SearchStudentSummaries(context.Background(), "", "", "1; DROP TABLE users", "asc", true, 50, 0)
	if err == nil {
		t.Fatal("unknown sort field must be rejected, it is concatenated into SQL")
	}
}
