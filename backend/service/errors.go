package service

import "fmt"

// NotFoundError indicates that the requested resource wasn't found.
type NotFoundError struct {
	Resource string
	ID       string
}

func (e NotFoundError) Error() string {
	return fmt.Sprintf("%s with ID %q not found", e.Resource, e.ID)
}

// DBError wraps unexpected database errors.
type DBError struct {
	Err error
}

func (e DBError) Error() string {
	return e.Err.Error()
}
