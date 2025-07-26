package repository

import "errors"

// ErrNotFound is returned when a queried row does not exist.
var ErrNotFound = errors.New("not found")
