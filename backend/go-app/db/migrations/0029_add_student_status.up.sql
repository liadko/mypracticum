-- Student freezing (#22). Apply BEFORE deploying the code that reads these
-- columns. Older code ignores them, and every student defaults to active.
--
-- status is a real column because every dashboard query filters on it.
-- status_details holds { reason, note, log[] }.
ALTER TABLE users
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
        CONSTRAINT users_status_valid CHECK (status IN ('active', 'frozen')),
    ADD COLUMN status_details JSONB NOT NULL DEFAULT '{}'::jsonb
        CONSTRAINT users_status_details_is_object CHECK (jsonb_typeof(status_details) = 'object');
