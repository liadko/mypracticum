package notifier

import "context"

// Notifier sends OTP codes and Invites via a delivery channel (email, SMS, etc.).
// Implementations (e.g. SmooveEmailClient) encapsulate any auth logic (OAuth/API keys)
// without the service needing to know about it.
type Notifier interface {
	SendOTP(ctx context.Context, destination, firstName, code string) error
	SendInvite(ctx context.Context, destination, firstName string) error
}
