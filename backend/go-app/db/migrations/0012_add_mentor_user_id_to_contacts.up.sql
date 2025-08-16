ALTER TABLE contacts
  ADD COLUMN mentor_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_contacts_mentor_user_id
  ON contacts (mentor_user_id);
