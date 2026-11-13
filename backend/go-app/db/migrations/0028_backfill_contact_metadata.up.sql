-- Step 2 of moving contact details into JSONB (#18).
--
-- Apply this only AFTER the dual-writing code is deployed. If it ran earlier,
-- older code could still change a column on a row that already has metadata,
-- and the app would then keep reading the stale metadata.
--
-- Only rows still at NULL are touched, so anything the new code already wrote
-- is left alone and re-running this is harmless.
UPDATE contacts
   SET metadata = jsonb_strip_nulls(jsonb_build_object(
           'email', email,
           'phone', phone,
           'specialty', specialty,
           'clientInstitution', client_institution,
           'clientTrainingCenterInfo', client_training_center_info
       ))
 WHERE metadata IS NULL;
