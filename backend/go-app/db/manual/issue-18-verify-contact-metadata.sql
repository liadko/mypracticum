-- Read-only check for the JSONB contact migration (#18).
-- Only meaningful until the app stops writing the old columns; after that,
-- contacts edited since will differ by design.
-- Run after migration 0028. Every count must be 0 before the old columns are
-- ever dropped.
SELECT
    count(*) FILTER (WHERE metadata IS NULL)                                            AS not_backfilled,
    count(*) FILTER (WHERE metadata->>'email' IS DISTINCT FROM email)                   AS email_differs,
    count(*) FILTER (WHERE metadata->>'phone' IS DISTINCT FROM phone)                   AS phone_differs,
    count(*) FILTER (WHERE metadata->>'specialty' IS DISTINCT FROM specialty)           AS specialty_differs,
    count(*) FILTER (WHERE metadata->>'clientInstitution' IS DISTINCT FROM client_institution) AS institution_differs,
    count(*) FILTER (WHERE metadata->>'clientTrainingCenterInfo' IS DISTINCT FROM client_training_center_info) AS centre_info_differs
FROM contacts;
