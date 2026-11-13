-- Use the original training-centre description as the centre name when the
-- structured name is still blank. Keep the original text and all other details.
-- Apply after 0031 (private-clinic cap). The legacy columns remain in place;
-- dropping them is a separate, optional migration (0033).
UPDATE contacts
   SET metadata = jsonb_set(
       metadata,
       '{trainingCenter}',
       COALESCE(NULLIF(metadata->'trainingCenter', 'null'::jsonb), '{}'::jsonb)
           || jsonb_build_object('name', metadata->>'clientTrainingCenterInfo'),
       true
   )
 WHERE type = 'client'
   AND metadata->>'clientInstitution' = 'trainingCenter'
   AND NULLIF(btrim(metadata->>'clientTrainingCenterInfo'), '') IS NOT NULL
   AND NULLIF(btrim(metadata->'trainingCenter'->>'name'), '') IS NULL
   AND (metadata->'trainingCenter' IS NULL
        OR jsonb_typeof(metadata->'trainingCenter') IN ('object', 'null'));
