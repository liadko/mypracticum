-- migrations/0021_add_manual_entries_to_counts.up.sql

DROP VIEW IF EXISTS admin_students_with_entry_counts;

CREATE OR REPLACE VIEW admin_students_with_entry_counts AS
WITH entry_stats AS (
    -- Aggregate standard entries
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
    -- Aggregate manual entries, treating 'mentor' type as automatically approved
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
    u.class,
    u.taz,
    CASE WHEN u.signature IS NULL THEN 'no' ELSE 'yes' END AS has_signature,
    u.created_at,
    u.created_by,

    -- Combine standard and manual counts
    COALESCE(es.client_entries_count, 0) + COALESCE(ms.manual_client_count, 0) AS client_entries_count,
    COALESCE(es.approved_mentor_entries_count, 0) + COALESCE(ms.manual_mentor_approved_count, 0) AS approved_mentor_entries_count,
    COALESCE(es.unapproved_mentor_entries_count, 0) AS unapproved_mentor_entries_count,
    COALESCE(es.therapist_entries_count, 0) + COALESCE(ms.manual_therapist_count, 0) AS therapist_entries_count,
    COALESCE(es.total_entries_count, 0) + COALESCE(ms.manual_total_count, 0) AS total_entries_count

FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id AND r.name = 'student'
LEFT JOIN entry_stats es ON es.student_id = u.id
LEFT JOIN manual_stats ms ON ms.user_id = u.id;