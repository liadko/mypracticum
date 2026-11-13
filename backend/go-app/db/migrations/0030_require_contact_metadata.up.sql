-- Step 3 of moving contact details into JSONB (#18).
--
-- From here on the app reads and writes contact details only in metadata, so
-- every contact must have it. Any row still at NULL is filled from the old
-- columns first (none are expected after 0028; this is a safety net), then
-- NULL is forbidden.
--
-- Safe to apply before or after deploying the code that stops using the old
-- columns: the code already running writes metadata on every save.
--
-- The old columns are left in place. Dropping them is a separate migration.
UPDATE contacts
   SET metadata = jsonb_strip_nulls(jsonb_build_object(
           'email', email,
           'phone', phone,
           'specialty', specialty,
           'clientInstitution', client_institution,
           'clientTrainingCenterInfo', client_training_center_info
       ))
 WHERE metadata IS NULL;

ALTER TABLE contacts ALTER COLUMN metadata SET NOT NULL;
