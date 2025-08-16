-- 1. Add new column with plain text
ALTER TABLE entries
    ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending';

-- 2. Migrate existing data
UPDATE entries
   SET approval_status = CASE
                   WHEN approved = TRUE  THEN 'approved'
                   ELSE 'pending'
               END;

-- 3. Drop old boolean
ALTER TABLE entries DROP COLUMN approved;