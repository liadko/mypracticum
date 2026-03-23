package format

import (
	"strings"
)

// SanitizeEmail lowercases, and strips whitespace and invisible Unicodes.
func SanitizeEmail(email string) string {
	if email == "" {
		return ""
	}
	// First pass: strip all bad characters. Second pass: convert to lowercase.
	return strings.ToLower(StripAllSpacesAndClean(email))
}
