package domain

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewUserFromNormalizesAndValidates(t *testing.T) {
	creator := uuid.New()

	u, err := NewUserFrom("  Noa ", " Levi", "  NOA@Example.COM ", creator, []string{"student"})
	if err != nil {
		t.Fatal(err)
	}
	if u.FirstName != "Noa" || u.LastName != "Levi" {
		t.Errorf("names not trimmed: %q %q", u.FirstName, u.LastName)
	}
	if u.Email != "noa@example.com" {
		t.Errorf("email not normalized: %q", u.Email)
	}

	invalid := []struct {
		name               string
		first, last, email string
		creator            uuid.UUID
		roles              []string
	}{
		{"no first name", " ", "Levi", "a@b.co", creator, []string{"student"}},
		{"no last name", "Noa", "", "a@b.co", creator, []string{"student"}},
		{"no email", "Noa", "Levi", "", creator, []string{"student"}},
		{"malformed email", "Noa", "Levi", "not-an-email", creator, []string{"student"}},
		{"no roles", "Noa", "Levi", "a@b.co", creator, nil},
		{"no creator", "Noa", "Levi", "a@b.co", uuid.Nil, []string{"student"}},
	}
	for _, tt := range invalid {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := NewUserFrom(tt.first, tt.last, tt.email, tt.creator, tt.roles); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestIsMentor(t *testing.T) {
	if (&User{Roles: []string{"student"}}).IsMentor() {
		t.Error("student is not a mentor")
	}
	if !(&User{Roles: []string{"student", "mentor"}}).IsMentor() {
		t.Error("user holding the mentor role is a mentor")
	}
}
