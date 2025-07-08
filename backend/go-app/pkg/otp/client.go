package otp

import "context"

// Client knows how to Send and Verify OTPs.
type Client interface {
	Send(ctx context.Context, email string) error
	Verify(ctx context.Context, email, code string) error
}
