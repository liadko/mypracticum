package format

import (
	"strings"
	"unicode"
)

// CleanText removes invisible formatting and control characters (like bidi markers),
// and only TRIMS leading/trailing whitespace.
// Use this for Names, Causes, Specialties, etc.
func CleanText(s string) string {
	if s == "" {
		return ""
	}
	// Strip control and invisible characters (but KEEP regular spaces)
	cleaned := strings.Map(func(r rune) rune {
		if unicode.Is(unicode.Cf, r) || unicode.IsControl(r) {
			return -1 // Drop the character
		}
		return r
	}, s)

	// Trim standard whitespace off the edges
	return strings.TrimSpace(cleaned)
}

// StripAllSpacesAndClean removes ALL whitespace (internal and external),
// plus invisible and control characters.
// Use this as a base for strict strings where internal spaces are invalid.
func StripAllSpacesAndClean(s string) string {
	if s == "" {
		return ""
	}
	return strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) || unicode.Is(unicode.Cf, r) || unicode.IsControl(r) {
			return -1 // Drop all spaces and invisible/control chars
		}
		return r
	}, s)
}
