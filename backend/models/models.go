package models

type PersonalEntry struct {
	ID                  string  `json:"id"`
	Date                string  `json:"date"`
	ExternalTherapistID *string `json:"externalTherapist,omitempty"`
}

type MentorEntry struct {
	ID       string  `json:"id"`
	Date     string  `json:"date"`
	MentorID *string `json:"mentorId,omitempty"`
}

type ClientEntry struct {
	ID         string `json:"id"`
	Date       string `json:"date"`
	ClientName string `json:"clientName"`
}
