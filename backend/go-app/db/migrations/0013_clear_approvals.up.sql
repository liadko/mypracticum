ALTER TABLE entries
    DROP COLUMN IF EXISTS approval_status;

-- 2. Add approver_id column (nullable by default)
ALTER TABLE entries
    ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id) ON DELETE SET NULL;
