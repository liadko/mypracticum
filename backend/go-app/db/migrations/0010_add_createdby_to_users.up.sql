-- 1) Add the column, nullable for now
ALTER TABLE users
    ADD COLUMN created_by UUID;

-- 2) Backfill existing rows with your admin UUID
UPDATE users
   SET created_by = 'bc8058b2-ee8c-4c3f-af45-a6b04088afa0'
 WHERE created_by IS NULL;

-- 3) Make it required
ALTER TABLE users
    ALTER COLUMN created_by SET NOT NULL;