package csv

import (
	"encoding/csv"
	"io"
	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/format"
	"mypracticum/backend/service"
	"net/mail"
	"strings"
)

func ParseStudentsCSV(r io.Reader) ([]domain.NewStudent, []service.StudentRowError) {
	cr := csv.NewReader(r)
	cr.TrimLeadingSpace = true
	cr.ReuseRecord = false

	records, err := cr.ReadAll()
	if err != nil {
		return nil, []service.StudentRowError{{Row: 0, Err: "failed to read csv: " + err.Error()}}
	}
	if len(records) == 0 {
		return nil, []service.StudentRowError{{Row: 0, Err: "empty csv"}}
	}

	// header map
	idx := map[string]int{}
	for i, h := range records[0] {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}
	required := []string{"firstname", "lastname", "email", "taz"}
	for _, k := range required {
		if _, ok := idx[k]; !ok {
			return nil, []service.StudentRowError{{Row: 0, Err: "missing header: " + k}}
		}
	}

	var out []domain.NewStudent
	var errs []service.StudentRowError

	for row := 1; row < len(records); row++ {
		rec := records[row]
		// tolerate ragged rows
		get := func(key string) string {
			col, ok := idx[key]
			if !ok || col >= len(rec) {
				return ""
			}
			return format.CleanText(rec[col])
		}

		first := get("firstname")
		last := get("lastname")
		email := format.SanitizeEmail(get("email"))
		taz := get("taz")

		if first == "" || last == "" || email == "" || taz == "" {
			errs = append(errs, service.StudentRowError{Row: row + 1, Email: email, Err: "missing required field"})
			continue
		}
		if _, e := mail.ParseAddress(email); e != nil {
			errs = append(errs, service.StudentRowError{Row: row + 1, Email: email, Err: "invalid email"})
			continue
		}

		out = append(out, domain.NewStudent{
			FirstName: first,
			LastName:  last,
			Email:     email,
			Taz:       taz,
		})
	}
	return out, errs
}
