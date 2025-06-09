package models

type PersonalEntry struct {
	ID                string                 `json:"id"`
	Date              string                 `json:"date"`
	ExternalTherapist *struct{ Name string } `json:"externalTherapist,omitempty"`
}

type MentorEntry struct {
	ID     string `json:"id"`
	Date   string `json:"date"`
	Mentor *struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"mentor,omitempty"`
}

type ClientEntry struct {
	ID         string `json:"id"`
	Date       string `json:"date"`
	ClientName string `json:"clientName"`
}
