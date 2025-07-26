package jwt

import "errors"

var (
	// ErrInvalidToken means the signature or format was wrong.
	ErrInvalidToken = errors.New("invalid token")
	// ErrExpiredToken means the token is past its expiration time.
	ErrExpiredToken = errors.New("token has expired")
)
