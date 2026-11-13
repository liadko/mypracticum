package postgres

import (
	"context"
	"encoding/json"
	"os"
	"reflect"
	"testing"

	"github.com/google/uuid"
)

func TestTrainingCenterNameBackfill(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "backfill@x.co", "student", nil)
	migration, err := os.ReadFile("../../db/migrations/0032_backfill_training_center_names.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	tests := []struct {
		name, contactType, metadata, want string
	}{
		{"legacy Hebrew", "client", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"עמותת הלל, אשדוד"}`, `{"name":"עמותת הלל, אשדוד"}`},
		{"null details", "client", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"מרכז","trainingCenter":null}`, `{"name":"מרכז"}`},
		{"partial details", "client", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"מרכז","trainingCenter":{"name":"  ","city":"אשדוד","contactPerson":"רינה","contactPhone":"050"},"other":"kept"}`, `{"name":"מרכז","city":"אשדוד","contactPerson":"רינה","contactPhone":"050"}`},
		{"existing name", "client", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"old","trainingCenter":{"name":"chosen"}}`, `{"name":"chosen"}`},
		{"blank legacy", "client", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"  "}`, ``},
		{"no legacy", "client", `{"clientInstitution":"trainingCenter"}`, ``},
		{"private clinic", "client", `{"clientInstitution":"privateClinic","clientTrainingCenterInfo":"old"}`, ``},
		{"mentor", "mentor", `{"clientInstitution":"trainingCenter","clientTrainingCenterInfo":"old"}`, ``},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id := uuid.New()
			if _, err := testDB.Exec(`INSERT INTO contacts (id,user_id,type,name,metadata) VALUES ($1,$2,$3,'A.B',$4::jsonb)`, id, student, tt.contactType, tt.metadata); err != nil {
				t.Fatal(err)
			}
			var original map[string]any
			if err := json.Unmarshal([]byte(tt.metadata), &original); err != nil {
				t.Fatal(err)
			}
			if _, err := testDB.Exec(string(migration)); err != nil {
				t.Fatal(err)
			}
			got := readMetadata(t, id)
			if tt.want != "" {
				var want map[string]any
				if err := json.Unmarshal([]byte(tt.want), &want); err != nil {
					t.Fatal(err)
				}
				original["trainingCenter"] = want
			}
			if !reflect.DeepEqual(got, original) {
				t.Fatalf("metadata = %#v, want %#v", got, original)
			}
			if _, err := testDB.Exec(string(migration)); err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(readMetadata(t, id), got) {
				t.Fatal("second run changed metadata")
			}
		})
	}
	// Verify the normal repository read exposes the migrated name to the API.
	contacts, err := NewPostgresContactRepo(testDB).ListByUser(context.Background(), student)
	if err != nil {
		t.Fatal(err)
	}
	// The backfill must be deployable while all five legacy columns still exist.
	rows, err := testDB.Query(`SELECT email, phone, specialty, client_institution, client_training_center_info FROM contacts LIMIT 0`)
	if err != nil {
		t.Fatalf("backfill must retain the legacy columns: %v", err)
	}
	rows.Close()
	for _, c := range contacts {
		if c.ClientTrainingCenterInfo != nil && *c.ClientTrainingCenterInfo == "עמותת הלל, אשדוד" {
			if c.TrainingCenter == nil || c.TrainingCenter.Name != *c.ClientTrainingCenterInfo {
				t.Fatalf("repository did not expose migrated name: %+v", c.TrainingCenter)
			}
			return
		}
	}
	t.Fatal("migrated contact was not returned")
}
