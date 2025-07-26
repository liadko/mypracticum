-- 1) Remove the old student_id column
ALTER TABLE users
  DROP COLUMN IF EXISTS student_id;

-- 2) Backfill & remove the old single name column
--    (If you want to preserve parts of “name”, run the UPDATE first.)
--    For example, to split on the first space:
UPDATE users
SET
  first_name = split_part(name, ' ', 1),
  last_name  = split_part(name, ' ', 2)
WHERE name IS NOT NULL;

ALTER TABLE users
  DROP COLUMN IF EXISTS name;

-- 3) Add first_name, last_name and signature columns
--    Existing rows get empty-string defaults for names
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS signature  BYTEA;

-- 4) Create the master roles table
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  name TEXT   NOT NULL UNIQUE
);

-- 5) Create the join table for many-to-many user↔role
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT  NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 6) Seed standard roles (won’t duplicate on re-run)
INSERT INTO roles(name) VALUES
  ('student'),
  ('mentor'),
  ('admin')
ON CONFLICT (name) DO NOTHING;
