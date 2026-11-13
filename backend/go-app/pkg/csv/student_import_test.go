package csv

import (
	"strings"
	"testing"
)

func TestParseStudentsCSV(t *testing.T) {
	t.Run("parses valid rows and ignores header case and order", func(t *testing.T) {
		input := "Email,TAZ,LastName,FirstName\nnoa@x.co,123456789,Levi,Noa\n"
		students, errs := ParseStudentsCSV(strings.NewReader(input))
		if len(errs) != 0 {
			t.Fatalf("unexpected errors: %+v", errs)
		}
		if len(students) != 1 {
			t.Fatalf("got %d students", len(students))
		}
		s := students[0]
		if s.FirstName != "Noa" || s.LastName != "Levi" || s.Email != "noa@x.co" || s.Taz != "123456789" {
			t.Fatalf("wrong mapping: %+v", s)
		}
	})

	t.Run("rejects a missing header", func(t *testing.T) {
		_, errs := ParseStudentsCSV(strings.NewReader("firstname,lastname,email\nNoa,Levi,noa@x.co\n"))
		if len(errs) != 1 || !strings.Contains(errs[0].Err, "taz") {
			t.Fatalf("got %+v", errs)
		}
	})

	t.Run("reports bad rows with spreadsheet row numbers and keeps good ones", func(t *testing.T) {
		input := "firstname,lastname,email,taz\n" +
			"Noa,Levi,noa@x.co,1\n" +
			",Cohen,c@x.co,2\n" +
			"Tal,Bar,not-an-email,3\n"
		students, errs := ParseStudentsCSV(strings.NewReader(input))
		if len(students) != 1 {
			t.Fatalf("got %d students", len(students))
		}
		if len(errs) != 2 || errs[0].Row != 3 || errs[1].Row != 4 {
			t.Fatalf("got %+v", errs)
		}
	})

	t.Run("empty file", func(t *testing.T) {
		_, errs := ParseStudentsCSV(strings.NewReader(""))
		if len(errs) != 1 {
			t.Fatalf("got %+v", errs)
		}
	})
}
