package format

import (
	"strings"
	"unicode"
)

// TrimCharacters strips whitespace and invisible Unicode formatting
// characters (like bidi markers U+202B, U+202C) and control characters from the input.
func TrimCharacters(s string) string {
	if s == "" {
		return ""
	}
	return strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) || unicode.Is(unicode.Cf, r) || unicode.IsControl(r) {
			return -1 // Drop the character
		}
		return r
	}, s)
}
