-- Abort before changing schema or assignments when legacy data contains an
-- unknown non-blank class. Known aliases are normalized with BTRIM below.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM users
         WHERE class IS NOT NULL
           AND BTRIM(class) <> ''
           AND BTRIM(class) NOT IN (
               'יב',
               'אוקטובר 2025',
               'צוות',
               'מחזור ט קבוצה 2',
               'מחזור יא קבוצה 1',
               'מחזור יא קבוצה 2',
               'מחזור יב אביב',
               'מחזור יג קבוצה 1',
               'מחזור יג קבוצה 2',
               'מחזור יג קבוצה 3',
               'מחזור יד קבוצה 1',
               'מחזור יד קבוצה 2',
               'מחזור יד קבוצה 3'
           )
    ) THEN
        RAISE EXCEPTION 'cannot migrate users.class: unexpected non-empty legacy class value exists';
    END IF;
END
$$;

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    client_start_date DATE,
    mentor_start_date DATE,
    therapist_start_date DATE,
    CONSTRAINT classes_name_trimmed_and_non_empty CHECK (name = BTRIM(name) AND name <> '')
);

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

ALTER TABLE users
    ADD COLUMN class_id UUID,
    ADD CONSTRAINT users_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE NO ACTION;

UPDATE users u
   SET class_id = c.id
  FROM classes c
 WHERE c.name = CASE BTRIM(u.class)
                    WHEN 'יב' THEN 'צוות'
                    WHEN 'אוקטובר 2025' THEN 'צוות'
                    ELSE BTRIM(u.class)
                END
   AND u.class IS NOT NULL
   AND BTRIM(u.class) <> '';

DROP VIEW IF EXISTS admin_students_with_entry_counts;
DROP VIEW IF EXISTS admin_mentor_contacts;
DROP VIEW IF EXISTS admin_manual_entries;
DROP VIEW IF EXISTS admin_entries;

CREATE VIEW admin_entries AS
SELECT
    e.id          AS entry_id,
    e.date        AS entry_date,
    e.created_at  AS entry_created_at,
    u.id          AS student_id,
    u.first_name  AS student_first_name,
    u.last_name   AS student_last_name,
    u.email       AS student_email,
    cl.name       AS student_class,
    u.taz         AS student_taz,
    c.id          AS contact_id,
    c.name        AS contact_name,
    c.type        AS contact_type,
    CASE
        WHEN c.type = 'mentor' AND e.approver_id IS NOT NULL THEN 'approved'
        WHEN c.type = 'mentor' AND e.approver_id IS NULL THEN 'not approved'
        ELSE NULL
    END AS approved_status
FROM entries e
JOIN users u ON e.user_id = u.id
LEFT JOIN classes cl ON cl.id = u.class_id
LEFT JOIN contacts c ON e.contact_id = c.id;

CREATE VIEW admin_students_with_entry_counts AS
WITH entry_stats AS (
    SELECT
        student_id,
        COUNT(*) FILTER (WHERE contact_type = 'client') AS client_entries_count,
        COUNT(*) FILTER (WHERE contact_type = 'mentor' AND approved_status = 'approved') AS approved_mentor_entries_count,
        COUNT(*) FILTER (WHERE contact_type = 'mentor' AND approved_status = 'not approved') AS unapproved_mentor_entries_count,
        COUNT(*) FILTER (WHERE contact_type = 'therapist') AS therapist_entries_count,
        COUNT(entry_id) AS total_entries_count
    FROM admin_entries
    GROUP BY student_id
),
manual_stats AS (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE type = 'client') AS manual_client_count,
        COUNT(*) FILTER (WHERE type = 'mentor') AS manual_mentor_approved_count,
        COUNT(*) FILTER (WHERE type = 'therapist') AS manual_therapist_count,
        COUNT(id) AS manual_total_count
    FROM manual_entries
    GROUP BY user_id
)
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    cl.name AS class,
    u.taz,
    CASE WHEN u.signature IS NULL THEN 'no' ELSE 'yes' END AS has_signature,
    u.created_at,
    u.created_by,
    COALESCE(es.client_entries_count, 0) + COALESCE(ms.manual_client_count, 0) AS client_entries_count,
    COALESCE(es.approved_mentor_entries_count, 0) + COALESCE(ms.manual_mentor_approved_count, 0) AS approved_mentor_entries_count,
    COALESCE(es.unapproved_mentor_entries_count, 0) AS unapproved_mentor_entries_count,
    COALESCE(es.therapist_entries_count, 0) + COALESCE(ms.manual_therapist_count, 0) AS therapist_entries_count,
    COALESCE(es.total_entries_count, 0) + COALESCE(ms.manual_total_count, 0) AS total_entries_count
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id AND r.name = 'student'
LEFT JOIN classes cl ON cl.id = u.class_id
LEFT JOIN entry_stats es ON es.student_id = u.id
LEFT JOIN manual_stats ms ON ms.user_id = u.id;

CREATE VIEW admin_mentor_contacts AS
WITH mentor_entry_stats AS (
    SELECT
        student_id,
        contact_id,
        COUNT(*) FILTER (WHERE approved_status = 'approved') AS approved_entries_count,
        COUNT(*) FILTER (WHERE approved_status = 'not approved') AS unapproved_entries_count,
        COUNT(entry_id) AS total_entries_count
    FROM admin_entries
    WHERE contact_type = 'mentor'
    GROUP BY student_id, contact_id
)
SELECT
    u.id AS student_id,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    cl.name AS student_class,
    u.taz AS student_taz,
    c.id AS contact_id,
    c.name AS mentor_name,
    c.email AS mentor_email,
    c.phone AS mentor_phone,
    c.specialty AS mentor_specialty,
    c.client_institution,
    c.client_training_center_info,
    COALESCE(mes.approved_entries_count, 0) AS approved_entries_count,
    COALESCE(mes.unapproved_entries_count, 0) AS unapproved_entries_count,
    COALESCE(mes.total_entries_count, 0) AS total_entries_count
FROM contacts c
JOIN users u ON c.user_id = u.id
LEFT JOIN classes cl ON cl.id = u.class_id
LEFT JOIN mentor_entry_stats mes ON mes.student_id = u.id AND mes.contact_id = c.id
WHERE c.type = 'mentor';

CREATE VIEW admin_manual_entries AS
SELECT
    me.id AS manual_entry_id,
    me.hours AS entry_hours,
    me.cause AS entry_cause,
    me.type AS entry_type,
    me.created_at AS entry_created_at,
    me.batch_id,
    u.id AS student_id,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    cl.name AS student_class,
    u.taz AS student_taz
FROM manual_entries me
JOIN users u ON me.user_id = u.id
LEFT JOIN classes cl ON cl.id = u.class_id;

ALTER TABLE users DROP COLUMN class;
