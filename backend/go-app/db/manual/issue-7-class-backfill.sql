-- Run only after migrations 0025 and 0026. This script is deliberately not a migration.
-- It defaults to ROLLBACK. Review all result sets, then replace the final ROLLBACK
-- with COMMIT when you are ready to apply the backfill.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM users u
         WHERE EXISTS (
                   SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = u.id AND r.name = 'student'
               )
           AND NULLIF(BTRIM(u.class), '') IS NOT NULL
           AND BTRIM(u.class) NOT IN (
               'יב', 'אוקטובר 2025', 'צוות', 'מחזור ט קבוצה 2',
               'מחזור יא קבוצה 1', 'מחזור יא קבוצה 2', 'מחזור יב אביב',
               'מחזור יג קבוצה 1', 'מחזור יג קבוצה 2', 'מחזור יג קבוצה 3',
               'מחזור יד קבוצה 1', 'מחזור יד קבוצה 2', 'מחזור יד קבוצה 3'
           )
    ) THEN
        RAISE EXCEPTION 'unexpected non-empty student users.class value exists';
    END IF;
END
$$;

INSERT INTO classes (name, client_start_date, mentor_start_date, therapist_start_date) VALUES
    ('צוות', NULL, NULL, NULL),
    ('מחזור ט קבוצה 2', NULL, NULL, NULL),
    ('מחזור יא קבוצה 1', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יא קבוצה 2', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יב אביב', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יג קבוצה 1', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יג קבוצה 2', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יג קבוצה 3', DATE '2026-01-01', DATE '2026-01-01', DATE '2026-01-01'),
    ('מחזור יד קבוצה 1', DATE '2026-01-01', DATE '2026-01-01', DATE '2025-04-01'),
    ('מחזור יד קבוצה 2', DATE '2026-01-01', DATE '2026-01-01', DATE '2025-04-01'),
    ('מחזור יד קבוצה 3', DATE '2026-01-01', DATE '2026-01-01', DATE '2025-04-01');

UPDATE users u
   SET class_id = c.id
  FROM classes c
 WHERE EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND r.name = 'student'
       )
   AND c.name = CASE BTRIM(u.class)
                    WHEN 'יב' THEN 'צוות'
                    WHEN 'אוקטובר 2025' THEN 'צוות'
                    ELSE BTRIM(u.class)
                END
   AND NULLIF(BTRIM(u.class), '') IS NOT NULL;

SELECT
    COUNT(*) FILTER (WHERE class_id IS NOT NULL) AS assigned_students,
    COUNT(*) FILTER (WHERE class_id IS NULL AND NULLIF(BTRIM(class), '') IS NOT NULL) AS unmatched_students
FROM users u
WHERE EXISTS (
    SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = u.id AND r.name = 'student'
);
-- Expected: assigned_students = 213 and unmatched_students = 0.

SELECT COUNT(*) AS non_student_class_assignments
FROM users u
WHERE NOT EXISTS (
          SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id AND r.name = 'student'
      )
  AND class_id IS NOT NULL;
-- Expected: non_student_class_assignments = 0.

ROLLBACK;
