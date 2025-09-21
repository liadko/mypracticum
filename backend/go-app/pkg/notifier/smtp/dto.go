package smtp

// EmailDTO represents the minimal email data needed to send an OTP message.
type EmailDTO struct {
	From    string
	To      string
	Subject string
	Body    string // plain text body
}

// MessageBytes builds a RFC-822 style message bytes for use with net/smtp.
func (e *EmailDTO) Message() []byte {
	msg := ""
	if e.From != "" {
		msg += "From: " + e.From + "\r\n"
	}
	msg += "To: " + e.To + "\r\n"
	msg += "Subject: " + e.Subject + "\r\n"
	msg += "MIME-Version: 1.0\r\n"
	msg += "Content-Type: text/plain; charset=utf-8\r\n"
	msg += "\r\n"
	msg += e.Body
	return []byte(msg)
}
