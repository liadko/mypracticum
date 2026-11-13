package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"mypracticum/backend/domain"

	"github.com/google/uuid"
)

// seedLegacyContact inserts a row the way pre-JSONB code left it: columns set,
// metadata NULL.
func seedLegacyContact(t *testing.T, owner uuid.UUID, kind, name string, email, phone, specialty, institution, info *string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	_, err := testDB.Exec(`
		INSERT INTO contacts (id, user_id, type, name, email, phone, specialty, client_institution, client_training_center_info)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		id, owner, kind, name, email, phone, specialty, institution, info)
	if err != nil {
		t.Fatalf("seed legacy contact: %v", err)
	}
	return id
}

func readMetadata(t *testing.T, id uuid.UUID) map[string]string {
	t.Helper()
	var raw sql.NullString
	if err := testDB.QueryRow(`SELECT metadata::text FROM contacts WHERE id = $1`, id).Scan(&raw); err != nil {
		t.Fatal(err)
	}
	if !raw.Valid {
		return nil
	}
	out := map[string]string{}
	if err := json.Unmarshal([]byte(raw.String), &out); err != nil {
		t.Fatal(err)
	}
	return out
}

func runBackfill(t *testing.T) {
	t.Helper()
	path := filepath.Join("..", "..", "db", "migrations", "0028_backfill_contact_metadata.up.sql")
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := testDB.Exec(string(content)); err != nil {
		t.Fatalf("backfill: %v", err)
	}
}

func TestUnmigratedRowIsReadFromColumns(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	seedLegacyContact(t, student, "client", "Old Client", nil, nil, nil, strptr("trainingCenter"), strptr("Hillel"))

	list, err := NewPostgresContactRepo(testDB).ListByUser(context.Background(), student)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 || *list[0].ClientInstitution != "trainingCenter" || *list[0].ClientTrainingCenterInfo != "Hillel" {
		t.Fatalf("legacy values lost: %+v", list)
	}
}

func TestWritesGoToBothColumnsAndMetadata(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)

	c := createContact(t, domain.Contact{
		UserID: student, Type: domain.TherapistContact, Name: "Tal",
		Phone: strptr("050"), Specialty: strptr("dynamic"),
	})

	assert := func(wantPhone string, wantSpecialty *string) {
		t.Helper()
		var phone string
		var specialty sql.NullString
		if err := testDB.QueryRow(`SELECT phone, specialty FROM contacts WHERE id = $1`, c.ID).Scan(&phone, &specialty); err != nil {
			t.Fatal(err)
		}
		metadata := readMetadata(t, c.ID)
		if phone != wantPhone || metadata["phone"] != wantPhone {
			t.Fatalf("phone column %q, metadata %q, want %q", phone, metadata["phone"], wantPhone)
		}
		if wantSpecialty == nil {
			if specialty.Valid {
				t.Fatalf("specialty column should be cleared, got %q", specialty.String)
			}
			if _, ok := metadata["specialty"]; ok {
				t.Fatal("specialty key should be removed from metadata")
			}
			return
		}
		if specialty.String != *wantSpecialty || metadata["specialty"] != *wantSpecialty {
			t.Fatalf("specialty column %q, metadata %q", specialty.String, metadata["specialty"])
		}
	}
	assert("050", strptr("dynamic"))

	c.Phone = strptr("052")
	c.Specialty = nil
	if _, err := repo.Update(ctx, student, c.ID, c); err != nil {
		t.Fatal(err)
	}
	assert("052", nil)
}

func TestMetadataWinsOverColumns(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	id := seedLegacyContact(t, student, "therapist", "Tal", nil, strptr("column-phone"), nil, nil, nil)
	if _, err := testDB.Exec(`UPDATE contacts SET metadata = '{"phone":"json-phone"}' WHERE id = $1`, id); err != nil {
		t.Fatal(err)
	}

	list, err := NewPostgresContactRepo(testDB).ListByUser(context.Background(), student)
	if err != nil {
		t.Fatal(err)
	}
	if *list[0].Phone != "json-phone" {
		t.Fatalf("got %q", *list[0].Phone)
	}
}

func TestBackfillPreservesEveryField(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)
	mentorID := seedLegacyContact(t, student, "mentor", "Dana", strptr("m@x.co"), strptr("050"), strptr("clinical"), nil, nil)
	clientID := seedLegacyContact(t, student, "client", "Zed", nil, nil, nil, strptr("trainingCenter"), strptr("שם ומיקום"))

	before, err := repo.ListByUser(ctx, student)
	if err != nil {
		t.Fatal(err)
	}

	runBackfill(t)

	if m := readMetadata(t, mentorID); m["email"] != "m@x.co" || m["phone"] != "050" || m["specialty"] != "clinical" {
		t.Fatalf("mentor metadata: %+v", m)
	}
	m := readMetadata(t, clientID)
	if m["clientInstitution"] != "trainingCenter" || m["clientTrainingCenterInfo"] != "שם ומיקום" {
		t.Fatalf("client metadata: %+v", m)
	}
	if _, hasEmail := m["email"]; hasEmail {
		t.Fatal("NULL columns must not become keys")
	}

	after, err := repo.ListByUser(ctx, student)
	if err != nil {
		t.Fatal(err)
	}
	beforeJSON, _ := json.Marshal(before)
	afterJSON, _ := json.Marshal(after)
	if string(beforeJSON) != string(afterJSON) {
		t.Fatalf("contacts changed across backfill:\n%s\n%s", beforeJSON, afterJSON)
	}
}

func TestBackfillLeavesAlreadyWrittenRowsAlone(t *testing.T) {
	resetDB(t)
	student := seedUser(t, "s@x.co", "student", nil)
	id := seedLegacyContact(t, student, "therapist", "Tal", nil, strptr("column-phone"), nil, nil, nil)
	if _, err := testDB.Exec(`UPDATE contacts SET metadata = '{"phone":"newer"}' WHERE id = $1`, id); err != nil {
		t.Fatal(err)
	}

	runBackfill(t)

	if m := readMetadata(t, id); m["phone"] != "newer" {
		t.Fatalf("backfill overwrote newer metadata: %+v", m)
	}
}

func TestMentorDuplicateCheckSeesMetadataAndColumns(t *testing.T) {
	resetDB(t)
	ctx := context.Background()
	repo := NewPostgresContactRepo(testDB)
	student := seedUser(t, "s@x.co", "student", nil)

	seedLegacyContact(t, student, "mentor", "Legacy", strptr("legacy@x.co"), strptr("050"), nil, nil, nil)
	createContact(t, mentorContact(student, "New", "new@x.co", nil))

	for _, email := range []string{"legacy@x.co", "new@x.co"} {
		if ok, err := repo.UserHasMentor(ctx, student, email); err != nil || !ok {
			t.Errorf("%s: got %v, %v", email, ok, err)
		}
	}
}
