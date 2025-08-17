package service

import (
	"fmt"
)

// NotFoundError indicates that the requested resource wasn't found.
type NotFoundError struct {
	Resource string
	ID       string
}

func (e NotFoundError) Error() string {
	return fmt.Sprintf("%s with ID %q not found", e.Resource, e.ID)
}

// AlreadyExistsError indicates a unique-key conflict at the business layer.
type AlreadyExistsError struct {
	Resource string // e.g., "user"
	Field    string // e.g., "email"
	Value    string // e.g., "foo@bar.com"
}

func (e AlreadyExistsError) Error() string {
	return e.Resource + " already exists: " + e.Field + "=" + e.Value
}

type ForbiddenError struct{ Reason string }

func (e ForbiddenError) Error() string { return e.Reason }

// ValidationError indicates the input was invalid.
type ValidationError string

func (e ValidationError) Error() string { return string(e) }

// DBError wraps unexpected database errors.
type DBError struct{ Err error }

func (e DBError) Error() string {
	return e.Err.Error()
}

type TokenGenerationError struct{ Err error }

func (e TokenGenerationError) Error() string {
	return fmt.Sprintf("token generation error: %v", e.Err)
}

type TokenValidationError struct{ Err error }

func (e TokenValidationError) Error() string {
	return fmt.Sprintf("token validation error: %v", e.Err)
}

type TooManyRequestsError struct {
	Msg string // e.g. "Please wait 2 minutes before trying again"
}

func (e TooManyRequestsError) Error() string {
	return e.Msg
}
