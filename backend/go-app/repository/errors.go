package repository

import "errors"

// ErrNotFound is returned when a queried row does not exist.
var ErrNotFound = errors.New("not found")

var ErrDuplicate = errors.New("duplicate")

var ErrAlreadyApproved = errors.New("entry already approved")
