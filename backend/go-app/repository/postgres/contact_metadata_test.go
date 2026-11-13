package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"

	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

func readMetadata(t *testing.T, id uuid.UUID) map[string]any {
	t.Helper()
	var raw string
	if err := testDB.QueryRow(`SELECT metadata::text FROM contacts WHERE id = $1`, id).Scan(&raw); err != nil {
		t.Fatal(err)
	}
	out := map[string]any{}
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		t.Fatal(err)
	}
	return out
}

func TestContactDetailsAreWrittenOnlyToMetadata(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)

	c := createContact(t, domain.Contact{
		UserID: student, Type: domain.TherapistContact, Name: "Tal",
		Phone: strptr("050"), Specialty: strptr("dynamic"),
	})

	assertOnlyMetadata := func(wantPhone string) {
		t.Helper()
		var phone, specialty sql.NullString
		if err := testDB.QueryRow(`SELECT phone, specialty FROM contacts WHERE id = $1`, c.ID).Scan(&phone, &specialty); err != nil {
			t.Fatal(err)
		}
		if phone.Valid || specialty.Valid {
			t.Fatalf("old columns must stay empty, got phone=%v specialty=%v", phone, specialty)
		}
		if got := readMetadata(t, c.ID)["phone"]; got != wantPhone {
			t.Fatalf("metadata phone = %v, want %s", got, wantPhone)
		}
	}
	assertOnlyMetadata("050")

	c.Phone = strptr("052")
	if _, err := repo.Update(ctx, student, c.ID, c); err != nil {
		t.Fatal(err)
	}
	assertOnlyMetadata("052")
}

func TestOldColumnValuesAreIgnored(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	c := createContact(t, domain.Contact{UserID: student, Type: domain.TherapistContact, Name: "Tal", Phone: strptr("from-metadata")})
	if _, err := testDB.Exec(`UPDATE contacts SET phone = 'stale-column' WHERE id = $1`, c.ID); err != nil {
		t.Fatal(err)
	}

	list, err := NewPostgresContactRepo(testDB).ListByUser(context.Background(), student)
	if err != nil {
		t.Fatal(err)
	}
	if *list[0].Phone != "from-metadata" {
		t.Fatalf("got %q", *list[0].Phone)
	}
}

func TestMetadataIsRequired(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	_, err := testDB.Exec(`INSERT INTO contacts (id, user_id, type, name) VALUES ($1, $2, 'client', 'A.B')`, uuid.New(), student)
	if err == nil {
		t.Fatal("a contact without metadata must be rejected")
	}
}

func TestTrainingCenterDetailsRoundTrip(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)

	details := &domain.TrainingCenterDetails{Name: "עמותת הלל", City: "אשדוד", ContactPerson: "רינה", ContactPhone: strptr("050")}
	c := createContact(t, domain.Contact{
		UserID: student, Type: domain.ClientContact, Name: "A.B",
		ClientInstitution: strptr("trainingCenter"), TrainingCenter: details,
	})

	list, err := repo.ListByUser(ctx, student)
	if err != nil {
		t.Fatal(err)
	}
	got := list[0].TrainingCenter
	if got == nil || *got.ContactPhone != "050" || got.Name != details.Name || got.City != details.City || got.ContactPerson != details.ContactPerson {
		t.Fatalf("got %+v", got)
	}

	c.TrainingCenter = nil
	c.ClientInstitution = strptr("privateClinic")
	updated, err := repo.Update(ctx, student, c.ID, c)
	if err != nil {
		t.Fatal(err)
	}
	if updated.TrainingCenter != nil {
		t.Fatalf("details should be cleared, got %+v", updated.TrainingCenter)
	}
}

func TestMentorDuplicateCheckUsesMetadata(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	createContact(t, mentorContact(student, "Dana", "dana@x.co", nil))

	if ok, err := repo.UserHasMentor(ctx, student, "dana@x.co"); err != nil || !ok {
		t.Fatalf("got %v, %v", ok, err)
	}
	if ok, err := repo.UserHasMentor(ctx, student, "other@x.co"); err != nil || ok {
		t.Fatalf("got %v, %v", ok, err)
	}
}
