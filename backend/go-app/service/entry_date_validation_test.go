package service

import (
	"errors"
	"testing"
	"time"

	"mypracticum/backend/domain"
)

func TestValidateEntryDate(t *testing.T) {
	cutoff := time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name    string
		date    time.Time
		cutoff  *time.Time
		wantErr string
	}{
		{name: "date before cutoff", date: time.Date(2025, 12, 31, 0, 0, 0, 0, time.UTC), cutoff: &cutoff, wantErr: "cannot report before 2026-01-01"},
		{name: "date on cutoff", date: cutoff, cutoff: &cutoff},
		{name: "no cutoff", date: time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateEntryDate(tt.date, tt.cutoff)
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("validateEntryDate() error = %v", err)
				}
				return
			}
			var validationErr domain.ValidationError
			if !errors.As(err, &validationErr) {
				t.Fatalf("validateEntryDate() error = %v, want domain.ValidationError", err)
			}
			if validationErr.Error() != tt.wantErr {
				t.Fatalf("validateEntryDate() error = %q, want %q", validationErr, tt.wantErr)
			}
		})
	}
}
