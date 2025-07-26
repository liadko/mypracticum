package otp

import "errors"

// ErrInvalidCode is returned when the OTP service rejects the code.
var ErrInvalidCode = errors.New("invalid OTP code")

var ErrInvalidRequest = errors.New("invalid request to OTP service")

// ErrServiceUnavailable is a generic upstream failure.
var ErrServiceUnavailable = errors.New("OTP service unavailable")
