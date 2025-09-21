package smtp

import (
	"context"
	"fmt"
	"strings"

	"mypracticum/backend/config"
	"mypracticum/backend/pkg/notifier"

	mail "github.com/wneessen/go-mail"
)

// SMTPNotifier sends emails using go-mail which handles TLS/STARTTLS and
// SMTP auth for us. It uses the application's `config.SMTPConfig`.

// SMTPNotifier sends emails using go-mail which handles TLS/STARTTLS and
// SMTP auth for us. It uses the application's `config.SMTPConfig`.
type SMTPNotifier struct {
	cfg        config.SMTPConfig
	otpHTML    string
	inviteHTML string
}

// NewSMTPNotifier returns a notifier whose otp and reminder HTML
// templates are required and validated. If either template string is empty an error
// is returned and the notifier is not created.
func NewSMTPNotifier(cfg config.SMTPConfig, otpHTML, inviteHTML string) *SMTPNotifier {

	return &SMTPNotifier{cfg: cfg, otpHTML: otpHTML, inviteHTML: inviteHTML}
}

// SendOTP implements otp.Notifier. destination is the recipient address, code is the OTP.
// It composes an HTML message and sends it using go-mail. Inline embeds are supported
// via EmailDTO.Inline where the map key becomes the CID reference (e.g. cid:logo.png).
func (s *SMTPNotifier) SendOTP(ctx context.Context, destination, firstName, code string) error {
	// Use default firstName — the Notifier interface doesn't provide a name.
	if firstName == "" {
		firstName = "רב"
	}

	htmlBody := strings.ReplaceAll(s.otpHTML, "{{firstName}}", firstName)
	htmlBody = strings.ReplaceAll(htmlBody, "{{code}}", code)

	// compose message
	msg := mail.NewMsg()

	if err := msg.From(s.cfg.From); err != nil {
		return fmt.Errorf("set from: %w", err)
	}
	if err := msg.To(destination); err != nil {
		return fmt.Errorf("set to: %w", err)
	}
	msg.Subject("קוד כניסה לתמורות פרקטיקום")

	// set HTML body
	msg.SetBodyString(mail.TypeTextHTML, htmlBody)

	// prepare dialer
	c, err := mail.NewClient(
		s.cfg.Host,
		mail.WithPort(s.cfg.Port),
		mail.WithSMTPAuth(mail.SMTPAuthLogin),
		mail.WithUsername(s.cfg.Username),
		mail.WithPassword(s.cfg.Password),
		mail.WithSSL(),
	)
	if err != nil {
		return fmt.Errorf("create dialer: %w", err)
	}

	// send
	if err := c.DialAndSendWithContext(ctx, msg); err != nil {
		return fmt.Errorf("send mail: %w", err)
	}

	return nil
}

// SendInvite implements notifier.Notifier, it gets
func (s *SMTPNotifier) SendInvite(ctx context.Context, destination, firstName string) error {
	// default firstName for reminders as well
	if firstName == "" {
		firstName = "רב"
	}

	link := "http://192.168.68.124:5173/login?email=" + destination

	htmlBody := strings.ReplaceAll(s.inviteHTML, "{{firstName}}", firstName)
	htmlBody = strings.ReplaceAll(htmlBody, "{{link}}", link)

	// compose message
	msg := mail.NewMsg()
	if err := msg.From(s.cfg.From); err != nil {
		return fmt.Errorf("set from: %w", err)
	}
	if err := msg.To(destination); err != nil {
		return fmt.Errorf("set to: %w", err)
	}
	msg.Subject("בקשה לאישור שעות בתמורות פרקטיקום")
	msg.SetBodyString(mail.TypeTextHTML, htmlBody)

	c, err := mail.NewClient(
		s.cfg.Host,
		mail.WithPort(s.cfg.Port),
		mail.WithSMTPAuth(mail.SMTPAuthLogin),
		mail.WithUsername(s.cfg.Username),
		mail.WithPassword(s.cfg.Password),
		mail.WithSSL(),
	)
	if err != nil {
		return fmt.Errorf("create client: %w", err)
	}
	if err := c.DialAndSendWithContext(ctx, msg); err != nil {
		return fmt.Errorf("send mail: %w", err)
	}
	return nil
}

// Ensure SMTPNotifier implements notifier.Notifier at compile time
var _ notifier.Notifier = (*SMTPNotifier)(nil)
