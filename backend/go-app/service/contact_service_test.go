package service

import (
	"context"
	"errors"
	"testing"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func strPtr(s string) *string { return &s }

const studentEmail = "student@x.co"

func newContactServiceFixture() (*ContactService, *fakeContactRepo, *fakeUserRepo, uuid.UUID) {
	student := domain.User{ID: uuid.New(), Email: studentEmail, Roles: []string{"student"}}
	users := &fakeUserRepo{users: map[string]domain.User{student.Email: student}}
	contacts := &fakeContactRepo{}
	return NewContactService(contacts, NewUserService(users), nil), contacts, users, student.ID
}

func mentorInput(email string) domain.NewContact {
	return domain.NewContact{Type: domain.MentorContact, Name: "Dana Cohen", Email: strPtr(email), Phone: strPtr("050")}
}

func TestAddClientContact(t *testing.T) {
	svc, repo, users, student := newContactServiceFixture()

	got, err := svc.AddContact(context.Background(), student, domain.NewContact{
		Type: domain.ClientContact, Name: "A.B", ClientInstitution: strPtr("privateClinic"),
	})
	if err != nil {
		t.Fatal(err)
	}
	if got.UserID != student || len(repo.created) != 1 {
		t.Fatalf("got %+v, persisted %d", got, len(repo.created))
	}
	if len(users.created) != 0 {
		t.Fatal("client contacts must not create users")
	}
}

func TestAddMentorCreatesAndLinksMentorUser(t *testing.T) {
	svc, repo, users, student := newContactServiceFixture()

	got, err := svc.AddContact(context.Background(), student, mentorInput("dana@x.co"))
	if err != nil {
		t.Fatal(err)
	}
	if len(users.created) != 1 {
		t.Fatalf("created %d users", len(users.created))
	}
	mentor := users.created[0]
	if mentor.FirstName != "Dana" || mentor.LastName != "Cohen" || !mentor.IsMentor() {
		t.Fatalf("wrong mentor user: %+v", mentor)
	}
	if got.MentorUserID == nil || *got.MentorUserID != mentor.ID || len(repo.created) != 1 {
		t.Fatalf("contact not linked: %+v", got)
	}
}

func TestAddMentorLinksExistingMentorInsteadOfDuplicating(t *testing.T) {
	svc, _, users, student := newContactServiceFixture()
	existing := domain.User{ID: uuid.New(), Email: "dana@x.co", Roles: []string{"mentor"}}
	users.users[existing.Email] = existing

	got, err := svc.AddContact(context.Background(), student, mentorInput(existing.Email))
	if err != nil {
		t.Fatal(err)
	}
	if len(users.created) != 0 || got.MentorUserID == nil || *got.MentorUserID != existing.ID {
		t.Fatalf("expected link to existing mentor, got %+v", got)
	}
}

func TestAddMentorConflicts(t *testing.T) {
	t.Run("mentor email cannot be the student's own", func(t *testing.T) {
		svc, _, _, student := newContactServiceFixture()
		_, err := svc.AddContact(context.Background(), student, mentorInput(studentEmail))
		var exists AlreadyExistsError
		if !errors.As(err, &exists) {
			t.Fatalf("got %T: %v", err, err)
		}
	})

	t.Run("same mentor twice for one student", func(t *testing.T) {
		svc, repo, _, student := newContactServiceFixture()
		repo.mentorExists = true
		_, err := svc.AddContact(context.Background(), student, mentorInput("dana@x.co"))
		var exists AlreadyExistsError
		if !errors.As(err, &exists) {
			t.Fatalf("got %T: %v", err, err)
		}
		if len(repo.created) != 0 {
			t.Fatal("duplicate must not be persisted")
		}
	})

	t.Run("email belonging to a non-mentor user", func(t *testing.T) {
		svc, _, users, student := newContactServiceFixture()
		users.users["other@x.co"] = domain.User{ID: uuid.New(), Email: "other@x.co", Roles: []string{"student"}}
		_, err := svc.AddContact(context.Background(), student, mentorInput("other@x.co"))
		var exists AlreadyExistsError
		if !errors.As(err, &exists) {
			t.Fatalf("got %T: %v", err, err)
		}
	})
}

func TestUpdateContact(t *testing.T) {
	t.Run("switching a client between institutions is allowed", func(t *testing.T) {
		svc, repo, _, student := newContactServiceFixture()
		_, err := svc.UpdateContact(context.Background(), student, uuid.New(), domain.NewContact{
			Type: domain.ClientContact, Name: "A.B",
			ClientInstitution: strPtr("trainingCenter"), ClientTrainingCenterInfo: strPtr("Hillel"),
		})
		if err != nil {
			t.Fatal(err)
		}
		if got := *repo.updated[0].ClientInstitution; got != "trainingCenter" {
			t.Fatalf("got %q", got)
		}
	})

	t.Run("non-mentor contacts never keep a mentor link", func(t *testing.T) {
		svc, repo, _, student := newContactServiceFixture()
		stale := uuid.New()
		_, err := svc.UpdateContact(context.Background(), student, uuid.New(), domain.NewContact{
			Type: domain.TherapistContact, Name: "Tal", Phone: strPtr("050"), MentorUserID: &stale,
		})
		if err != nil {
			t.Fatal(err)
		}
		if repo.updated[0].MentorUserID != nil {
			t.Fatal("mentor link should be cleared")
		}
	})

	t.Run("missing contact maps to NotFoundError", func(t *testing.T) {
		svc, repo, _, student := newContactServiceFixture()
		repo.updateErr = repository.ErrNotFound
		_, err := svc.UpdateContact(context.Background(), student, uuid.New(), domain.NewContact{
			Type: domain.ClientContact, Name: "A.B", ClientInstitution: strPtr("privateClinic"),
		})
		var nf NotFoundError
		if !errors.As(err, &nf) {
			t.Fatalf("got %T: %v", err, err)
		}
	})
}

func TestSplitName(t *testing.T) {
	tests := []struct{ in, first, last string }{
		{"", "", ""},
		{"Dana", "Dana", ""},
		{"Dana Cohen", "Dana", "Cohen"},
		{"  Dana  Bat  Cohen ", "Dana Bat", "Cohen"},
	}
	for _, tt := range tests {
		first, last := splitName(tt.in)
		if first != tt.first || last != tt.last {
			t.Errorf("splitName(%q) = %q, %q", tt.in, first, last)
		}
	}
}
