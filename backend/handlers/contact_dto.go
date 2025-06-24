package handlers

// ContactResponse is the JSON shape returned by the Contacts API.
type ContactResponse struct {
	ID        string  `json:"id"`
	UserID    string  `json:"userId"`
	Type      string  `json:"type"`
	Name      string  `json:"name"`
	Email     *string `json:"email,omitempty"`
	Phone     *string `json:"phone,omitempty"`
	Specialty *string `json:"specialty,omitempty"`
}
