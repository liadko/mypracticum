package otp

import (
	"bytes"
	"context"
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

func (c *httpOtpClient) Send(ctx context.Context, email string) error {

	payload := map[string]string{"email": email}
	body, _ := json.Marshal(payload)

	// create the HTTP request with context
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url+"/v1/otp", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode >= 200 && resp.StatusCode < 300:
		return nil

	case resp.StatusCode == http.StatusBadRequest:
		return ErrInvalidRequest

	case resp.StatusCode >= 500:
		return ErrServiceUnavailable

	default:
		return fmt.Errorf("otp service returned status %d", resp.StatusCode)
	}
}

func (c *httpOtpClient) Verify(ctx context.Context, email, code string) error {
	body, _ := json.Marshal(map[string]string{"email": email, "code": code})
	resp, err := c.client.Post(c.url+"/v1/verify", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK, http.StatusNoContent:
		return nil

	case http.StatusBadRequest:
		// malformed request
		return ErrInvalidRequest

	case http.StatusNotFound:
		// treat as invalid request or define a new ErrNotFound if you prefer
		return ErrInvalidRequest

	case http.StatusUnauthorized:
		// wrong or expired code
		return ErrInvalidCode

	case http.StatusInternalServerError,
		http.StatusBadGateway,
		http.StatusServiceUnavailable:
		// service error
		return ErrServiceUnavailable

	default:
		// unexpected status
		return fmt.Errorf("OTP service returned status %d", resp.StatusCode)
	}
}
