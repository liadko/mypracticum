package otp

// Client knows how to Send and Verify OTPs.
type Client interface {
	Send(email string) error
	Verify(email, code string) error
}
