-- Step 4 (last) of moving contact details into JSONB (#18). Numbered after
-- the private-clinic cap (0031) and center-name backfill (0032), so the
-- backfill can be applied independently while these columns remain intact.
--
-- The app stopped reading and writing these columns in 0030's release; all of
-- their data lives in contacts.metadata. This deletes them for good.
--
-- Take a backup first (scripts\db\backup.ps1). There is no undo except
-- restoring that backup.
ALTER TABLE contacts
    DROP COLUMN email,
    DROP COLUMN phone,
    DROP COLUMN specialty,
    DROP COLUMN client_institution,
    DROP COLUMN client_training_center_info;
