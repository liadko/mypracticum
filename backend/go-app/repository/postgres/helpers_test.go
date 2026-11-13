package postgres

import (
	"context"
	"testing"

	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// resetDB empties the data tables so every test starts clean. Roles are seeded
// by migrations and are kept.
func resetDB(t *testing.T) {
	t.Helper()
	const q = `TRUNCATE entries, manual_entries, contacts, user_roles, users, classes CASCADE`
	if _, err := testDB.Exec(q); err != nil {
		t.Fatalf("reset db: %v", err)
	}
}

func seedClass(t *testing.T, name string) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	if err := testDB.QueryRow(`INSERT INTO classes (name) VALUES ($1) RETURNING id`, name).Scan(&id); err != nil {
		t.Fatalf("seed class: %v", err)
	}
	return id
}

// seedUser inserts a user directly, with created_by pointing at itself.
func seedUser(t *testing.T, email, role string, classID *uuid.UUID) uuid.UUID {
	t.Helper()
	id := uuid.New()
	var class any
	if classID != nil {
		class = *classID
	}
	_, err := testDB.Exec(
		`INSERT INTO users (id, first_name, last_name, email, created_by, class_id) VALUES ($1, 'First', 'Last', $2, $1, $3)`,
		id, email, class,
	)
	if err != nil {
		t.Fatalf("seed user: %v", err)
	}
	_, err = testDB.Exec(
		`INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2`,
		id, role,
	)
	if err != nil {
		t.Fatalf("seed role: %v", err)
	}
	return id
}

func strptr(s string) *string { return &s }

func createContact(t *testing.T, c domain.Contact) domain.Contact {
	t.Helper()
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	out, err := NewPostgresContactRepo(testDB).Create(context.Background(), c.UserID, c)
	if err != nil {
		t.Fatalf("create contact: %v", err)
	}
	return out
}

func clientContact(owner uuid.UUID, name, institution string) domain.Contact {
	return domain.Contact{UserID: owner, Type: domain.ClientContact, Name: name, ClientInstitution: strptr(institution)}
}

func mentorContact(owner uuid.UUID, name, email string, mentorUser *uuid.UUID) domain.Contact {
	return domain.Contact{
		UserID: owner, Type: domain.MentorContact, Name: name,
		Email: strptr(email), Phone: strptr("050"), MentorUserID: mentorUser,
	}
}
