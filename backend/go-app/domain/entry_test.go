package domain

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNewEntryFrom(t *testing.T) {
	user, contact := uuid.New(), uuid.New()
	today := time.Now().Format("2006-01-02")

	tests := []struct {
		name    string
		user    uuid.UUID
		entry   NewEntry
		wantErr string
	}{
		{name: "valid", user: user, entry: NewEntry{ContactID: contact, DateStr: today}},
		{name: "past date", user: user, entry: NewEntry{ContactID: contact, DateStr: "2024-03-01"}},
		{name: "wrong date format", user: user, entry: NewEntry{ContactID: contact, DateStr: "01/03/2024"}, wantErr: "YYYY-MM-DD"},
		{name: "impossible date", user: user, entry: NewEntry{ContactID: contact, DateStr: "2024-02-31"}, wantErr: "YYYY-MM-DD"},
		{name: "missing user", user: uuid.Nil, entry: NewEntry{ContactID: contact, DateStr: today}, wantErr: "userID"},
		{name: "missing contact", user: user, entry: NewEntry{DateStr: today}, wantErr: "contactID"},
		{
			name:    "far future",
			user:    user,
			entry:   NewEntry{ContactID: contact, DateStr: time.Now().AddDate(0, 0, 5).Format("2006-01-02")},
			wantErr: "future",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NewEntryFrom(tt.user, tt.entry)
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("got err %v, want substring %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if got.ID == uuid.Nil {
				t.Error("ID not generated")
			}
			if got.Approved {
				t.Error("new entries must start unapproved")
			}
		})
	}
}
