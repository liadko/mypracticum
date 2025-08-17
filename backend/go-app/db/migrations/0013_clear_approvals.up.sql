ALTER TABLE entries
    DROP COLUMN IF EXISTS approved;

-- 2. Add approver_id column (nullable by default)
ALTER TABLE entries
    ADD COLUMN approver_id UUID REFERENCES users(id) ON DELETE SET NULL;
