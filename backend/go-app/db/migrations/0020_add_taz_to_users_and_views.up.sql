-- 1. Drop views dependent on the users table structure
DROP VIEW IF EXISTS admin_students_with_entry_counts;
DROP VIEW IF EXISTS admin_entries;

-- 2. Add the Taz column
-- We allow NULL (default) so existing users don't break the UNIQUE constraint.
-- We add a CHECK constraint to ensure we don't accidentally store empty strings.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS taz TEXT,
    ADD CONSTRAINT users_taz_key UNIQUE (taz),
    ADD CONSTRAINT users_taz_not_empty CHECK (taz <> '');

-- 3. Recreate admin_entries view with the new student_taz column
CREATE OR REPLACE VIEW admin_entries AS
SELECT
    e.id          AS entry_id,
    e.date        AS entry_date,
    e.created_at  AS entry_created_at,

    -- student info
    u.id          AS student_id,
    u.first_name  AS student_first_name,
    u.last_name   AS student_last_name,
    u.email       AS student_email,
    u.class       AS student_class,
    u.taz         AS student_taz, -- Added

    -- contact info
    c.id          AS contact_id,
    c.name        AS contact_name,
    c.type        AS contact_type,

    -- approval status
    CASE
        WHEN c.type = 'mentor' AND e.approver_id IS NOT NULL THEN 'approved'
        WHEN c.type = 'mentor' AND e.approver_id IS NULL  THEN 'not approved'
        ELSE NULL
    END AS approved_status

FROM entries e
JOIN users u ON e.user_id = u.id
LEFT JOIN contacts c ON e.contact_id = c.id;

-- 4. Recreate admin_students_with_entry_counts view with the new taz column
CREATE OR REPLACE VIEW admin_students_with_entry_counts AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.class,
    u.taz, -- Added
    CASE WHEN u.signature IS NULL THEN 'no' ELSE 'yes' END AS has_signature,
    u.created_at,
    u.created_by,

    COUNT(*) FILTER (WHERE ae.contact_type = 'client')    AS client_entries_count,
    COUNT(*) FILTER (WHERE ae.contact_type = 'mentor' AND ae.approved_status = 'approved')    AS approved_mentor_entries_count,
    COUNT(*) FILTER (WHERE ae.contact_type = 'mentor' AND ae.approved_status = 'not approved') AS unapproved_mentor_entries_count,
    COUNT(*) FILTER (WHERE ae.contact_type = 'therapist') AS therapist_entries_count,
    COUNT(ae.entry_id)                                    AS total_entries_count

FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id AND r.name = 'student'
LEFT JOIN admin_entries ae ON ae.student_id = u.id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.class, u.taz, u.signature, u.created_at, u.created_by;