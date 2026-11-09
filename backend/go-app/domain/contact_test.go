package domain

import (
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func ptr(s string) *string { return &s }

func TestContactValidate(t *testing.T) {
	owner := uuid.New()

	mentor := func(mutate func(*Contact)) Contact {
		c := Contact{UserID: owner, Type: MentorContact, Name: "Dana", Email: ptr("dana@x.co"), Phone: ptr("050")}
		if mutate != nil {
			mutate(&c)
		}
		return c
	}
	therapist := func(mutate func(*Contact)) Contact {
		c := Contact{UserID: owner, Type: TherapistContact, Name: "Tal", Phone: ptr("050")}
		if mutate != nil {
			mutate(&c)
		}
		return c
	}
	client := func(mutate func(*Contact)) Contact {
		c := Contact{UserID: owner, Type: ClientContact, Name: "A.B", ClientInstitution: ptr("privateClinic")}
		if mutate != nil {
			mutate(&c)
		}
		return c
	}

	tests := []struct {
		name    string
		contact Contact
		wantErr string // substring; empty means valid
	}{
		{name: "valid mentor", contact: mentor(nil)},
		{name: "valid therapist", contact: therapist(nil)},
		{name: "valid private clinic client", contact: client(nil)},
		{
			name: "valid training centre client",
			contact: client(func(c *Contact) {
				c.ClientInstitution = ptr("trainingCenter")
				c.ClientTrainingCenterInfo = ptr("Hillel, Ashdod")
			}),
		},
		{name: "missing owner", contact: mentor(func(c *Contact) { c.UserID = uuid.Nil }), wantErr: "userID"},
		{name: "blank name", contact: client(func(c *Contact) { c.Name = "  " }), wantErr: "name must be provided"},
		{name: "mentor without email", contact: mentor(func(c *Contact) { c.Email = nil }), wantErr: "email is required"},
		{name: "mentor with blank email", contact: mentor(func(c *Contact) { c.Email = ptr(" ") }), wantErr: "email is required"},
		{name: "mentor without phone", contact: mentor(func(c *Contact) { c.Phone = nil }), wantErr: "phone is required"},
		{name: "therapist without phone", contact: therapist(func(c *Contact) { c.Phone = nil }), wantErr: "phone is required"},
		{name: "blank specialty", contact: therapist(func(c *Contact) { c.Specialty = ptr(" ") }), wantErr: "specialty"},
		{name: "client without institution", contact: client(func(c *Contact) { c.ClientInstitution = nil }), wantErr: "clientInstitution"},
		{name: "client with unknown institution", contact: client(func(c *Contact) { c.ClientInstitution = ptr("hospital") }), wantErr: "clientInstitution"},
		{
			name:    "training centre without info",
			contact: client(func(c *Contact) { c.ClientInstitution = ptr("trainingCenter") }),
			wantErr: "clientTrainingCenterInfo",
		},
		{name: "unknown type", contact: Contact{UserID: owner, Type: "cousin", Name: "X"}, wantErr: "invalid contact type"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.contact.Validate()
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("expected valid, got %v", err)
				}
				return
			}
			var ve ValidationError
			if !errors.As(err, &ve) {
				t.Fatalf("expected ValidationError, got %T: %v", err, err)
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Fatalf("error %q does not contain %q", err, tt.wantErr)
			}
		})
	}
}

func TestNewContactFromAssignsIDAndValidates(t *testing.T) {
	owner := uuid.New()

	c, err := NewContactFrom(owner, NewContact{Type: ClientContact, Name: "A.B", ClientInstitution: ptr("privateClinic")})
	if err != nil {
		t.Fatal(err)
	}
	if c.ID == uuid.Nil || c.UserID != owner {
		t.Fatalf("id/owner not set: %+v", c)
	}

	if _, err := NewContactFrom(owner, NewContact{Type: ClientContact, Name: "A.B"}); err == nil {
		t.Fatal("expected validation error for client without institution")
	}
}

func TestUpdatedContactKeepsGivenID(t *testing.T) {
	owner, id := uuid.New(), uuid.New()
	c, err := UpdatedContact(owner, id, NewContact{Type: TherapistContact, Name: "Tal", Phone: ptr("050")})
	if err != nil {
		t.Fatal(err)
	}
	if c.ID != id {
		t.Fatalf("got ID %s, want %s", c.ID, id)
	}
}

func TestIsValidContactType(t *testing.T) {
	for _, valid := range []ContactType{ClientContact, MentorContact, TherapistContact} {
		if !IsValidContactType(valid) {
			t.Errorf("%q should be valid", valid)
		}
	}
	if IsValidContactType("student") {
		t.Error(`"student" is a view-only type and must not be valid`)
	}
}
