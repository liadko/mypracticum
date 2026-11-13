package domain

import "testing"

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
