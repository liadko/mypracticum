package postgres

import (
	"context"
	"errors"
	"testing"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func freeze(t *testing.T, id uuid.UUID, reason domain.FreezeReason, note, line string) {
	t.Helper()
	err := NewPostgresUserRepo(testDB).UpdateStudentStatus(context.Background(), id, domain.StatusChange{
		Status: domain.StudentFrozen, Reason: reason, Note: note, LogLine: line,
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestStudentsDefaultToActive(t *testing.T) {
	resetDB(t)
	id := seedUser(t, "s@x.co", "student", nil)

	u, err := NewPostgresUserRepo(testDB).FindByID(context.Background(), id)
	if err != nil {
		t.Fatal(err)
	}
	if u.Status != domain.StudentActive || u.IsFrozen() {
		t.Fatalf("got %+v", u.Status)
	}
}

func TestFreezeThenUnfreezeKeepsLogAndClearsReason(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresUserRepo(testDB)
	id := seedUser(t, "s@x.co", "student", nil)

	freeze(t, id, domain.FreezeOther, "moved abroad", "line one")
	u, err := repo.FindByID(ctx, id)
	if err != nil {
		t.Fatal(err)
	}
	if !u.IsFrozen() || u.StatusDetails.Reason != domain.FreezeOther || u.StatusDetails.Note != "moved abroad" {
		t.Fatalf("got %+v", u.StatusDetails)
	}

	err = repo.UpdateStudentStatus(ctx, id, domain.StatusChange{Status: domain.StudentActive, LogLine: "line two"})
	if err != nil {
		t.Fatal(err)
	}
	u, err = repo.FindByID(ctx, id)
	if err != nil {
		t.Fatal(err)
	}
	if u.IsFrozen() || u.StatusDetails.Reason != "" || u.StatusDetails.Note != "" {
		t.Fatalf("got %+v", u.StatusDetails)
	}
	if len(u.StatusDetails.Log) != 2 || u.StatusDetails.Log[0] != "line one" || u.StatusDetails.Log[1] != "line two" {
		t.Fatalf("log = %v", u.StatusDetails.Log)
	}
}

func TestUpdateStatusUnknownUser(t *testing.T) {
	resetDB(t)
	err := NewPostgresUserRepo(testDB).UpdateStudentStatus(context.Background(), uuid.New(), domain.StatusChange{Status: domain.StudentActive})
	if !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestFindByTazIgnoringLeadingZeros(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresUserRepo(testDB)
	id := seedUser(t, "s@x.co", "student", nil)
	if _, err := testDB.Exec(`UPDATE users SET taz = '012345678' WHERE id = $1`, id); err != nil {
		t.Fatal(err)
	}

	for _, input := range []string{"012345678", "12345678"} {
		u, err := repo.FindByTazIgnoringLeadingZeros(ctx, input)
		if err != nil || u.ID != id {
			t.Errorf("%s: got %v, %v", input, u.ID, err)
		}
	}
	if _, err := repo.FindByTazIgnoringLeadingZeros(ctx, "999"); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestReportHidesFrozenStudentsUnlessAsked(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresReportRepo(testDB)
	seedUser(t, "live@x.co", "student", nil)
	frozen := seedUser(t, "frozen@x.co", "student", nil)
	freeze(t, frozen, domain.FreezeOnLeave, "", "line")

	got, total, err := repo.SearchStudentSummaries(ctx, "", "", "name", "asc", domain.ListActiveStudents, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || got[0].Email != "live@x.co" {
		t.Fatalf("default view: total=%d rows=%+v", total, got)
	}

	got, total, err = repo.SearchStudentSummaries(ctx, "frozen", "", "name", "asc", domain.ListAllStudents, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || got[0].Status != domain.StudentFrozen || got[0].StatusDetails.Reason != domain.FreezeOnLeave {
		t.Fatalf("with frozen: total=%d rows=%+v", total, got)
	}
}

func TestReportFrozenOnlyAndStatusSort(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresReportRepo(testDB)
	seedUser(t, "a-live@x.co", "student", nil)
	frozen := seedUser(t, "b-frozen@x.co", "student", nil)
	seedUser(t, "c-live@x.co", "student", nil)
	freeze(t, frozen, domain.FreezeOnLeave, "", "line")

	got, total, err := repo.SearchStudentSummaries(ctx, "", "", "name", "asc", domain.ListFrozenStudents, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || got[0].Email != "b-frozen@x.co" {
		t.Fatalf("frozen only: total=%d rows=%+v", total, got)
	}

	got, _, err = repo.SearchStudentSummaries(ctx, "", "", "status", "desc", domain.ListAllStudents, 50, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 3 || got[0].Email != "b-frozen@x.co" {
		t.Fatalf("status sort should put frozen first, got %+v", got)
	}
}

func TestEntryStatusLookups(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	contact := createContact(t, clientContact(student, "A.B", "privateClinic"))
	entry := addEntry(t, student, contact.ID, "2025-01-10")

	freeze(t, student, domain.FreezeFinished, "", "line")

	if got, err := repo.UserStatus(ctx, student); err != nil || got != domain.StudentFrozen {
		t.Fatalf("UserStatus: %v, %v", got, err)
	}
	if got, err := repo.EntryOwnerStatus(ctx, entry.ID); err != nil || got != domain.StudentFrozen {
		t.Fatalf("EntryOwnerStatus: %v, %v", got, err)
	}
	if _, err := repo.EntryOwnerStatus(ctx, uuid.New()); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestMentorViewsCarryStudentStatus(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	student := seedUser(t, "s@x.co", "student", nil)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))
	freeze(t, student, domain.FreezeOnLeave, "", "line")

	users, err := NewPostgresUserRepo(testDB).ListStudentsForMentor(ctx, mentor)
	if err != nil {
		t.Fatal(err)
	}
	views := domain.MapUsersToStudentContactViews(users)
	if len(views) != 1 || !views[0].StudentFrozen {
		t.Fatalf("got %+v", views)
	}

	reportStudents, err := NewPostgresReportRepo(testDB).ListMentorStudents(ctx, mentor)
	if err != nil {
		t.Fatal(err)
	}
	if len(reportStudents) != 1 || reportStudents[0].Status != domain.StudentFrozen {
		t.Fatalf("got %+v", reportStudents)
	}
}
