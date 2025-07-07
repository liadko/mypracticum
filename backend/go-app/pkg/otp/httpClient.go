package otp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type httpOtpClient struct {
	url    string
	client *http.Client
}

func NewHttpOtpClient(baseURL string) Client {
	return &httpOtpClient{
		url:    strings.TrimRight(baseURL, "/"),
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *httpOtpClient) Send(email string) error {
	body, _ := json.Marshal(map[string]string{"email": email})
	resp, err := c.client.Post(c.url+"/v1/otp", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	defer resp.Body.Close()
	switch {
	case resp.StatusCode >= 200 && resp.StatusCode < 300:
		return nil
	case resp.StatusCode == http.StatusBadRequest:
		// invalid email format, etc.
		return ErrInvalidRequest
	case resp.StatusCode >= 500:
		// upstream server error
		return ErrServiceUnavailable
	default:
		// anything else (e.g. 418, 302 redirects, etc.)
		return fmt.Errorf("otp service returned status %d", resp.StatusCode)
	}
}

func (c *httpOtpClient) Verify(email, code string) error {
	body, _ := json.Marshal(map[string]string{"email": email, "code": code})
	resp, err := c.client.Post(c.url+"/v1/otp/verify", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNoContent:
		return nil

	case resp.StatusCode == http.StatusBadRequest:
		// malformed request
		return ErrInvalidRequest

	case resp.StatusCode == http.StatusUnauthorized:
		// wrong or expired code
		return ErrInvalidCode

	case resp.StatusCode >= 500:
		// service error
		return ErrServiceUnavailable

	default:
		// unexpected status
		return fmt.Errorf("OTP service returned status %d", resp.StatusCode)
	}
}
