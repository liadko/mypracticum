package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

func assertFrozen(t *testing.T, err error) {
	t.Helper()
	var frozen StudentFrozenError
	if !errors.As(err, &frozen) {
		t.Fatalf("got %T: %v, want StudentFrozenError", err, err)
	}
}

func TestFrozenStudentCannotChangeEntries(t *testing.T) {
	repo := &fakeEntryRepo{status: domain.StudentFrozen}
	svc := NewEntryService(repo)

	_, err := svc.AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "2024-03-01"})
	assertFrozen(t, err)
	if len(repo.created) != 0 {
		t.Fatal("entry must not be persisted")
	}

	assertFrozen(t, svc.RemoveEntry(context.Background(), uuid.New(), uuid.New()))
}

func TestMentorCannotApproveOrUnapproveFrozenStudent(t *testing.T) {
	for _, approved := range []bool{true, false} {
		repo := &fakeEntryRepo{status: domain.StudentFrozen, linked: true}
		_, err := NewEntryService(repo).SetApproval(context.Background(), uuid.New(), uuid.New(), approved)
		assertFrozen(t, err)
		if repo.approverSet != nil {
			t.Fatal("approval must not change")
		}
	}
}

func TestUnrelatedMentorSeesForbiddenNotFrozen(t *testing.T) {
	repo := &fakeEntryRepo{status: domain.StudentFrozen, linked: false}
	_, err := NewEntryService(repo).SetApproval(context.Background(), uuid.New(), uuid.New(), true)
	var forbidden ForbiddenError
	if !errors.As(err, &forbidden) {
		t.Fatalf("got %T: %v", err, err)
	}
}

func TestAdminBulkApprovalIgnoresFreeze(t *testing.T) {
	// status is frozen, but the bulk path must never consult it.
	repo := &fakeEntryRepo{status: domain.StudentFrozen}
	res, err := NewEntryService(repo).BulkSetApproval(context.Background(), uuid.New(), []uuid.UUID{uuid.New()}, true)
	if err != nil || res.Succeeded != 1 {
		t.Fatalf("got %+v, %v", res, err)
	}
}

func frozenContactFixture(t *testing.T) (*ContactService, *fakeContactRepo, uuid.UUID) {
	t.Helper()
	svc, contacts, users, id := newContactServiceFixture()
	student := users.users[studentEmail]
	student.Status = domain.StudentFrozen
	users.users[studentEmail] = student
	return svc, contacts, id
}

func TestFrozenStudentCannotChangeContacts(t *testing.T) {
	input := domain.NewContact{Type: domain.ClientContact, Name: "A.B", ClientInstitution: strPtr("privateClinic")}

	t.Run("add", func(t *testing.T) {
		svc, repo, student := frozenContactFixture(t)
		_, err := svc.AddContact(context.Background(), student, input)
		assertFrozen(t, err)
		if len(repo.created) != 0 {
			t.Fatal("contact must not be persisted")
		}
	})

	t.Run("update", func(t *testing.T) {
		svc, repo, student := frozenContactFixture(t)
		_, err := svc.UpdateContact(context.Background(), student, uuid.New(), input)
		assertFrozen(t, err)
		if len(repo.updated) != 0 {
			t.Fatal("contact must not be persisted")
		}
	})

	t.Run("invite mentor", func(t *testing.T) {
		svc, _, student := frozenContactFixture(t)
		assertFrozen(t, svc.InviteMentor(context.Background(), student, uuid.New()))
	})
}

func statusFixture() (*UserService, *fakeUserRepo, uuid.UUID, domain.User, domain.User) {
	admin := domain.User{ID: uuid.New(), Email: "admin@x.co", Roles: []string{"admin"}}
	a := domain.User{ID: uuid.New(), Email: "a@x.co", Taz: "012345678", Roles: []string{"student"}}
	b := domain.User{ID: uuid.New(), Email: "b@x.co", Taz: "22222", Roles: []string{"student"}}
	repo := &fakeUserRepo{users: map[string]domain.User{admin.Email: admin, a.Email: a, b.Email: b}}
	return NewUserService(repo), repo, admin.ID, a, b
}

func TestSetStudentStatusResolvesEveryIdentifierKind(t *testing.T) {
	svc, repo, admin, a, b := statusFixture()

	res, err := svc.SetStudentStatus(context.Background(), admin, StudentStatusRequest{
		Identifiers: []string{a.ID.String(), " b@X.co ", "ghost@x.co", "", "999"},
		Status:      domain.StudentFrozen,
		Reason:      domain.FreezeFinished,
		Note:        " forms sent ",
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Total != 4 || res.Updated != 2 || len(res.NotFound) != 2 {
		t.Fatalf("got %+v", res)
	}
	change, ok := repo.changes[b.ID]
	if !ok || change.Status != domain.StudentFrozen || change.Reason != domain.FreezeFinished || change.Note != "forms sent" {
		t.Fatalf("got %+v", change)
	}
	if _, ok := repo.changes[a.ID]; !ok {
		t.Fatal("student matched by ID was not updated")
	}
}

func TestSetStudentStatusCountsADuplicateStudentOnce(t *testing.T) {
	svc, repo, admin, a, _ := statusFixture()
	res, err := svc.SetStudentStatus(context.Background(), admin, StudentStatusRequest{
		Identifiers: []string{a.Email, a.Taz},
		Status:      domain.StudentFrozen,
		Reason:      domain.FreezeOnLeave,
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Updated != 1 || len(repo.changes) != 1 {
		t.Fatalf("got %+v", res)
	}
}

func TestSetStudentStatusSkipsNonStudents(t *testing.T) {
	svc, repo, admin, _, _ := statusFixture()
	res, err := svc.SetStudentStatus(context.Background(), admin, StudentStatusRequest{
		Identifiers: []string{"admin@x.co"},
		Status:      domain.StudentFrozen,
		Reason:      domain.FreezeOnLeave,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(res.NotFound) != 1 || len(repo.changes) != 0 {
		t.Fatalf("got %+v", res)
	}
}

func TestSetStudentStatusRejectsInvalidRequestBeforeWriting(t *testing.T) {
	svc, repo, admin, a, _ := statusFixture()
	_, err := svc.SetStudentStatus(context.Background(), admin, StudentStatusRequest{
		Identifiers: []string{a.Email},
		Status:      domain.StudentFrozen,
	})
	var invalid domain.ValidationError
	if !errors.As(err, &invalid) {
		t.Fatalf("got %T: %v", err, err)
	}
	if len(repo.changes) != 0 {
		t.Fatal("nothing should be written")
	}
}

func TestStatusLogLine(t *testing.T) {
	at := time.Date(2026, 11, 9, 14, 3, 0, 0, time.UTC)

	frozen := statusLogLine(at, "admin@x.co", domain.StudentFrozen, domain.FreezeOther, "moved abroad")
	for _, part := range []string{"2026-11-09 14:03 UTC", "frozen by admin@x.co", "other", "moved abroad"} {
		if !strings.Contains(frozen, part) {
			t.Errorf("%q is missing %q", frozen, part)
		}
	}

	unfrozen := statusLogLine(at, "admin@x.co", domain.StudentActive, "", "")
	if !strings.Contains(unfrozen, "unfrozen by admin@x.co") {
		t.Errorf("got %q", unfrozen)
	}
}
