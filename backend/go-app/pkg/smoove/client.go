package smoove

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// SmooveClient calls the Smoove CRM API to send emails.
type SmooveClient struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

// NewSmooveClient constructs a SmooveClient with the given API base URL and key.
func NewSmooveClient(baseURL, apiKey string) *SmooveClient {
	return &SmooveClient{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Send implements the otp.Notifier interface.
func (c *SmooveClient) Send(ctx context.Context, destination, code string) error {
	endpoint := fmt.Sprintf("%s/Campaigns?sendNow=true&templateName=mypracticum-otp", c.BaseURL)

	requestDTO := EmailRequest{
		CustomData: []KeyValue{
			{Key: "%OTP_CODE%", Value: code},
		},
		ToMembersByEmail: []string{destination},
	}
	data, err := json.Marshal(requestDTO)
	if err != nil {
		return fmt.Errorf("marshal smoove payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("create smoove request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("send smoove request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("smoove returned status %d", resp.StatusCode)
	}
	return nil
}

// {
//   "customData": [
//     { "key": "%OTP_CODE%", "value": "123456" }
//   ],
//   "toMembersById": [831266604],
//   "toMembersByEmail": ["funky8oy@gmail.com"]
// }
