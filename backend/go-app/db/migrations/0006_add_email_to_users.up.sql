BEGIN;

-- 1) Add as nullable
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- 2) Backfill each existing user with a unique placeholder
UPDATE users
   SET email = 'user' || id || 'email@example.com'
 WHERE email IS NULL;

-- 3) Make it NOT NULL and unique
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

COMMIT;