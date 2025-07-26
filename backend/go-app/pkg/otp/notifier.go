package otp

import "context"

// Notifier sends OTP codes via a delivery channel (email, SMS, etc.).
// Implementations (e.g. SmooveEmailClient) encapsulate any auth logic (OAuth/API keys)
// without the service needing to know about it.
type Notifier interface {
	Send(ctx context.Context, destination, code string) error
}
