package postgres

import (
	"context"
	"errors"
	"testing"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

func TestContactRoundTripsEveryField(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentorUser := seedUser(t, "m@x.co", "mentor", nil)

	want := domain.Contact{
		ID: uuid.New(), UserID: student, Type: domain.MentorContact, Name: "Dana",
		Email: strptr("m@x.co"), Phone: strptr("050"), Specialty: strptr("clinical"), MentorUserID: &mentorUser,
	}
	if _, err := repo.Create(ctx, student, want); err != nil {
		t.Fatal(err)
	}
	client := domain.Contact{
		ID: uuid.New(), UserID: student, Type: domain.ClientContact, Name: "Zed",
		ClientInstitution: strptr("trainingCenter"), ClientTrainingCenterInfo: strptr("Hillel, Ashdod"),
	}
	if _, err := repo.Create(ctx, student, client); err != nil {
		t.Fatal(err)
	}

	list, err := repo.ListByUser(ctx, student)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Fatalf("got %d contacts", len(list))
	}
	got := list[0] // ordered by name
	if got.ID != want.ID || *got.Email != "m@x.co" || *got.Phone != "050" || *got.Specialty != "clinical" || *got.MentorUserID != mentorUser {
		t.Fatalf("mentor fields lost: %+v", got)
	}
	gotClient := list[1]
	if *gotClient.ClientInstitution != "trainingCenter" || *gotClient.ClientTrainingCenterInfo != "Hillel, Ashdod" {
		t.Fatalf("client fields lost: %+v", gotClient)
	}
}

func TestContactUpdateIsScopedToOwner(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	owner := seedUser(t, "a@x.co", "student", nil)
	stranger := seedUser(t, "b@x.co", "student", nil)
	c := createContact(t, clientContact(owner, "A.B", "privateClinic"))

	c.ClientInstitution = strptr("trainingCenter")
	c.ClientTrainingCenterInfo = strptr("Hillel")
	if _, err := repo.Update(ctx, stranger, c.ID, c); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("stranger update: got %v, want ErrNotFound", err)
	}

	updated, err := repo.Update(ctx, owner, c.ID, c)
	if err != nil {
		t.Fatal(err)
	}
	if *updated.ClientInstitution != "trainingCenter" {
		t.Fatalf("got %+v", updated)
	}
}

func TestUserHasMentorExcept(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	c := createContact(t, mentorContact(student, "Dana", "m@x.co", nil))

	if ok, err := repo.UserHasMentor(ctx, student, "m@x.co"); err != nil || !ok {
		t.Fatalf("got %v, %v", ok, err)
	}
	if ok, err := repo.UserHasMentorExcept(ctx, student, "m@x.co", c.ID); err != nil || ok {
		t.Fatalf("excluding itself: got %v, %v", ok, err)
	}
	if ok, err := repo.UserHasMentor(ctx, student, "other@x.co"); err != nil || ok {
		t.Fatalf("other email: got %v, %v", ok, err)
	}
}

func TestGetMentorOnlyReturnsMentors(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	client := createContact(t, clientContact(student, "A.B", "privateClinic"))
	mentor := createContact(t, mentorContact(student, "Dana", "m@x.co", nil))

	if _, err := repo.GetMentor(ctx, student, client.ID); !errors.Is(err, repository.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
	got, err := repo.GetMentor(ctx, student, mentor.ID)
	if err != nil {
		t.Fatal(err)
	}
	if *got.Email != "m@x.co" {
		t.Fatalf("got %+v", got)
	}
}
