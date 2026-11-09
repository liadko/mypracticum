package postgres

import (
	"context"
	"errors"
	"testing"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func addEntry(t *testing.T, user, contact uuid.UUID, date string) domain.Entry {
	t.Helper()
	parsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		t.Fatal(err)
	}
	e, err := NewPostgresEntryRepo(testDB).Create(context.Background(), domain.Entry{
		ID: uuid.New(), UserID: user, ContactID: contact, Date: parsed,
	})
	if err != nil {
		t.Fatalf("create entry: %v", err)
	}
	return e
}

func TestApprovalLocksStudentDeletion(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	contact := createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))

	entry := addEntry(t, student, contact.ID, "2025-01-10")
	updated, err := repo.UpdateApproval(ctx, entry.ID, &mentor)
	if err != nil {
		t.Fatal(err)
	}
	if !updated.Approved {
		t.Fatal("entry should be approved")
	}
	if err := repo.DeleteIfNotApproved(ctx, entry.ID, student); !errors.Is(err, repository.ErrAlreadyApproved) {
		t.Fatalf("got %v, want ErrAlreadyApproved", err)
	}

	if _, err := repo.UpdateApproval(ctx, entry.ID, nil); err != nil {
		t.Fatal(err)
	}
	if err := repo.DeleteIfNotApproved(ctx, entry.ID, student); err != nil {
		t.Fatalf("unapproved entry should delete: %v", err)
	}
}

func TestStudentCannotDeleteAnotherStudentsEntry(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	other := seedUser(t, "o@x.co", "student", nil)
	contact := createContact(t, clientContact(student, "A.B", "privateClinic"))
	entry := addEntry(t, student, contact.ID, "2025-01-10")

	err := NewPostgresEntryRepo(testDB).DeleteIfNotApproved(context.Background(), entry.ID, other)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v, want ErrNotFound", err)
	}
}

func TestListByStudentAndMentor(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	mc := createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))
	cc := createContact(t, clientContact(student, "A.B", "privateClinic"))
	addEntry(t, student, mc.ID, "2025-01-10")
	addEntry(t, student, cc.ID, "2025-01-11")

	all, err := repo.ListByStudent(ctx, student)
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != 2 || all[0].Date.Format("2006-01-02") != "2025-01-11" {
		t.Fatalf("expected 2 entries newest first, got %+v", all)
	}

	forMentor, err := repo.ListByMentor(ctx, mentor)
	if err != nil {
		t.Fatal(err)
	}
	if len(forMentor) != 1 || forMentor[0].ContactID != mc.ID {
		t.Fatalf("mentor should only see their own entries, got %+v", forMentor)
	}
}

func TestIsEntryLinkedToMentor(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	other := seedUser(t, "x@x.co", "mentor", nil)
	mc := createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))
	entry := addEntry(t, student, mc.ID, "2025-01-10")

	if ok, err := repo.IsEntryLinkedToMentor(ctx, entry.ID, mentor); err != nil || !ok {
		t.Fatalf("got %v, %v", ok, err)
	}
	if ok, err := repo.IsEntryLinkedToMentor(ctx, entry.ID, other); err != nil || ok {
		t.Fatalf("got %v, %v", ok, err)
	}
	if _, err := repo.IsEntryLinkedToMentor(ctx, uuid.New(), mentor); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestAdminDeleteEntriesIgnoresApproval(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentor := seedUser(t, "m@x.co", "mentor", nil)
	mc := createContact(t, mentorContact(student, "Dana", "m@x.co", &mentor))
	entry := addEntry(t, student, mc.ID, "2025-01-10")
	if _, err := repo.UpdateApproval(ctx, entry.ID, &mentor); err != nil {
		t.Fatal(err)
	}

	deleted, err := repo.DeleteEntriesByIDs(ctx, []uuid.UUID{entry.ID, uuid.New()})
	if err != nil {
		t.Fatal(err)
	}
	if deleted != 1 {
		t.Fatalf("deleted %d", deleted)
	}
}

func TestManualEntriesDeleteByIDOrBatch(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresEntryRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	batch := uuid.New()

	create := func(b *uuid.UUID) domain.ManualEntry {
		e, err := repo.CreateManualEntry(ctx, domain.NewManualEntry{UserID: student, Hours: 5, Cause: "summary", Type: "client", BatchID: b})
		if err != nil {
			t.Fatal(err)
		}
		return e
	}
	create(&batch)
	create(&batch)
	single := create(nil)
	keep := create(nil)

	if _, batches, err := repo.DeleteManualEntriesByIDs(ctx, []uuid.UUID{batch, single.ID}); err != nil || batches != 2 {
		t.Fatalf("batches=%d err=%v", batches, err)
	}
	left, err := repo.ListManualEntriesByUserID(ctx, student)
	if err != nil {
		t.Fatal(err)
	}
	if len(left) != 1 || left[0].ID != keep.ID {
		t.Fatalf("got %+v", left)
	}
}

func TestCreateManualEntryForUnknownUser(t *testing.T) {
	resetDB(t)
	_, err := NewPostgresEntryRepo(testDB).CreateManualEntry(context.Background(), domain.NewManualEntry{
		UserID: uuid.New(), Hours: 1, Cause: "x", Type: "client",
	})
	if !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}
