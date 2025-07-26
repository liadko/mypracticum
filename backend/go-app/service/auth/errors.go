package auth

import "errors"

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidOTP        = errors.New("invalid one-time code")
	ErrExpiredOTP        = errors.New("expired one-time code")
	ErrOAuthDenied       = errors.New("oauth authentication denied")
	ErrOAuthTokenInvalid = errors.New("oauth token invalid")
)
