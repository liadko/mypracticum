-- Step 1 of moving contact details into JSONB (#18).
--
-- NULL means "not migrated yet, read the old columns". The old columns stay in
-- place and the app keeps writing them, so a rollback to older code is safe.
--
-- Apply this BEFORE deploying the code that reads the column. The backfill is a
-- separate migration (0028) that runs AFTER that deploy.
ALTER TABLE contacts
    ADD COLUMN metadata JSONB
    CONSTRAINT contacts_metadata_is_object
    CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');
