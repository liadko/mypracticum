package format

import "time"

const ISODate = "2006-01-02"

// Date formats a date for the API's date-only fields.
func Date(value time.Time) string {
	return value.Format(ISODate)
}

// OptionalDate formats a nullable date for the API's date-only fields.
func OptionalDate(value *time.Time) *string {
	if value == nil {
		return nil
	}
	formatted := Date(*value)
	return &formatted
}
