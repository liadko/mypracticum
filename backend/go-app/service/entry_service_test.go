package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func TestAddEntryPersistsValidEntry(t *testing.T) {
	repo := &fakeEntryRepo{}
	svc := NewEntryService(repo)
	user, contact := uuid.New(), uuid.New()

	got, err := svc.AddEntry(context.Background(), user, domain.NewEntry{ContactID: contact, DateStr: "2024-03-01"})
	if err != nil {
		t.Fatal(err)
	}
	if got.UserID != user || got.ContactID != contact {
		t.Fatalf("wrong entry: %+v", got)
	}
	if len(repo.created) != 1 {
		t.Fatalf("persisted %d entries", len(repo.created))
	}
}

func TestAddEntryWithSomeoneElsesContactIsNotFound(t *testing.T) {
	repo := &fakeEntryRepo{createErr: repository.ErrNotFound}
	_, err := NewEntryService(repo).AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "2024-03-01"})
	var nf NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("got %T: %v", err, err)
	}
}

func TestAddEntryBeforeClassStartDateIsRejected(t *testing.T) {
	cutoff := time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC)
	repo := &fakeEntryRepo{cutoff: &cutoff}
	svc := NewEntryService(repo)

	_, err := svc.AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "2024-08-31"})
	var ve domain.ValidationError
	if !errors.As(err, &ve) {
		t.Fatalf("got %T: %v", err, err)
	}
	if len(repo.created) != 0 {
		t.Fatal("entry must not be persisted")
	}

	if _, err := svc.AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "2024-09-01"}); err != nil {
		t.Fatalf("the start date itself is allowed: %v", err)
	}
}

func TestAddEntryCutoffLookupForUnknownContactIsNotFound(t *testing.T) {
	repo := &fakeEntryRepo{cutoffErr: repository.ErrNotFound}
	_, err := NewEntryService(repo).AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "2024-03-01"})
	var nf NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("got %T: %v", err, err)
	}
}

func TestAddEntryRejectsInvalidDateWithoutTouchingRepo(t *testing.T) {
	repo := &fakeEntryRepo{}
	_, err := NewEntryService(repo).AddEntry(context.Background(), uuid.New(), domain.NewEntry{ContactID: uuid.New(), DateStr: "nope"})

	var ve domain.ValidationError
	if !errors.As(err, &ve) {
		t.Fatalf("got %T: %v", err, err)
	}
	if len(repo.created) != 0 {
		t.Fatal("invalid entry must not be persisted")
	}
}

func TestRemoveEntryErrorMapping(t *testing.T) {
	tests := []struct {
		name    string
		repoErr error
		check   func(error) bool
	}{
		{"success", nil, func(e error) bool { return e == nil }},
		{"missing", repository.ErrNotFound, func(e error) bool { var x NotFoundError; return errors.As(e, &x) }},
		{"approved entries are locked", repository.ErrAlreadyApproved, func(e error) bool { var x ValidationError; return errors.As(e, &x) }},
		{"database failure", errors.New("boom"), func(e error) bool { var x DBError; return errors.As(e, &x) }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewEntryService(&fakeEntryRepo{deleteErr: tt.repoErr}).RemoveEntry(context.Background(), uuid.New(), uuid.New())
			if !tt.check(err) {
				t.Fatalf("unexpected result: %T %v", err, err)
			}
		})
	}
}

func TestSetApproval(t *testing.T) {
	mentor := uuid.New()

	t.Run("linked mentor approves, recording themselves as approver", func(t *testing.T) {
		repo := &fakeEntryRepo{linked: true}
		got, err := NewEntryService(repo).SetApproval(context.Background(), mentor, uuid.New(), true)
		if err != nil {
			t.Fatal(err)
		}
		if !got.Approved || repo.approverSet == nil || *repo.approverSet == nil || **repo.approverSet != mentor {
			t.Fatalf("approver not recorded: %+v", got)
		}
	})

	t.Run("un-approving clears the approver", func(t *testing.T) {
		repo := &fakeEntryRepo{linked: true}
		got, err := NewEntryService(repo).SetApproval(context.Background(), mentor, uuid.New(), false)
		if err != nil {
			t.Fatal(err)
		}
		if got.Approved || repo.approverSet == nil || *repo.approverSet != nil {
			t.Fatal("approver should be cleared")
		}
	})

	t.Run("unrelated mentor is forbidden", func(t *testing.T) {
		repo := &fakeEntryRepo{linked: false}
		_, err := NewEntryService(repo).SetApproval(context.Background(), mentor, uuid.New(), true)
		var forbidden ForbiddenError
		if !errors.As(err, &forbidden) {
			t.Fatalf("got %T: %v", err, err)
		}
		if repo.approverSet != nil {
			t.Fatal("approval must not be written")
		}
	})

	t.Run("missing entry", func(t *testing.T) {
		repo := &fakeEntryRepo{linkErr: repository.ErrNotFound}
		_, err := NewEntryService(repo).SetApproval(context.Background(), mentor, uuid.New(), true)
		var nf NotFoundError
		if !errors.As(err, &nf) {
			t.Fatalf("got %T: %v", err, err)
		}
	})
}

func TestBulkSetApprovalCountsOutcomes(t *testing.T) {
	repo := &sequencedApprovalRepo{results: []error{nil, repository.ErrNotFound, errors.New("boom"), nil}}
	ids := []uuid.UUID{uuid.New(), uuid.New(), uuid.New(), uuid.New()}

	res, err := NewEntryService(repo).BulkSetApproval(context.Background(), uuid.New(), ids, true)
	if err != nil {
		t.Fatal(err)
	}
	if res.Total != 4 || res.Succeeded != 2 || len(res.NotFound) != 1 || len(res.Errors) != 1 {
		t.Fatalf("got %+v", res)
	}
}

// sequencedApprovalRepo returns a scripted error per call, to exercise bulk paths.
type sequencedApprovalRepo struct {
	repository.EntryRepo
	results []error
	calls   int
}

func (r *sequencedApprovalRepo) UpdateApproval(_ context.Context, id uuid.UUID, _ *uuid.UUID) (domain.Entry, error) {
	err := r.results[r.calls]
	r.calls++
	return domain.Entry{ID: id}, err
}
