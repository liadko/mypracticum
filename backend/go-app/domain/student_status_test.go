package domain

import "testing"

func TestParseStudentStatusFilter(t *testing.T) {
	tests := []struct {
		status        string
		includeFrozen bool
		want          StudentStatusFilter
		wantErr       bool
	}{
		{"", false, ListActiveStudents, false},
		{"", true, ListAllStudents, false},
		{"frozen", false, ListFrozenStudents, false},
		{" ALL ", false, ListAllStudents, false},
		{"active", true, ListActiveStudents, false},
		{"paused", false, "", true},
	}
	for _, tt := range tests {
		got, err := ParseStudentStatusFilter(tt.status, tt.includeFrozen)
		if (err != nil) != tt.wantErr || got != tt.want {
			t.Errorf("ParseStudentStatusFilter(%q, %v) = %q, %v", tt.status, tt.includeFrozen, got, err)
		}
	}
}

func TestStatusChangeValidate(t *testing.T) {
	tests := []struct {
		name   string
		change StatusChange
		valid  bool
	}{
		{"freeze with reason", StatusChange{Status: StudentFrozen, Reason: FreezeOnLeave}, true},
		{"freeze with reason and note", StatusChange{Status: StudentFrozen, Reason: FreezeOther, Note: "x"}, true},
		{"freeze without reason", StatusChange{Status: StudentFrozen}, false},
		{"freeze with unknown reason", StatusChange{Status: StudentFrozen, Reason: "bored"}, false},
		{"unfreeze", StatusChange{Status: StudentActive}, true},
		{"unfreeze with reason", StatusChange{Status: StudentActive, Reason: FreezeOnLeave}, false},
		{"unfreeze with note", StatusChange{Status: StudentActive, Note: "x"}, false},
		{"unknown status", StatusChange{Status: "paused", Reason: FreezeOnLeave}, false},
		{"empty status", StatusChange{}, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.change.Validate()
			if (err == nil) != tt.valid {
				t.Fatalf("got %v, want valid=%v", err, tt.valid)
			}
		})
	}
}
