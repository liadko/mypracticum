-- 1) Create the new contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('client','mentor','therapist')),
  name TEXT NOT NULL,
  email TEXT,          -- only for mentors
  phone TEXT,          -- only for mentors
  specialty TEXT CHECK(specialty IN ('clinical','dynamic','skateboarder')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Copy existing clients, mentors, therapists into contacts
INSERT INTO contacts (user_id, type, name)
  SELECT user_id, 'client', name FROM clients;

INSERT INTO contacts (user_id, type, name, email, phone, specialty)
  SELECT user_id, 'mentor', name, email, phone, profession FROM mentors;

INSERT INTO contacts (user_id, type, name, specialty)
  SELECT user_id, 'therapist', name, profession FROM external_therapists;

-- 3) Add contact_id FK to entries and populate it
ALTER TABLE entries ADD COLUMN contact_id UUID;
UPDATE entries
  SET contact_id = (
    SELECT id FROM contacts
     WHERE contacts.user_id = entries.user_id
       AND contacts.name = CASE
         WHEN entries.client_id   IS NOT NULL THEN (SELECT name FROM clients    WHERE id=entries.client_id)
         WHEN entries.mentor_id   IS NOT NULL THEN (SELECT name FROM mentors    WHERE id=entries.mentor_id)
         WHEN entries.external_therapist_id IS NOT NULL THEN (SELECT name FROM external_therapists WHERE id=entries.external_therapist_id)
       END
  );

ALTER TABLE entries
  DROP COLUMN client_id,
  DROP COLUMN mentor_id,
  DROP COLUMN external_therapist_id,
  ADD CONSTRAINT fk_entries_contact FOREIGN KEY(contact_id) REFERENCES contacts(id);

-- 4) Drop the old tables
DROP TABLE clients, mentors, external_therapists;
