-- migrations/0022_admin_mentor_contacts_view.up.sql

CREATE OR REPLACE VIEW admin_mentor_contacts AS
WITH mentor_entry_stats AS (
    -- Aggregate entry counts per student and mentor contact
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
    -- Student Details
    u.id AS student_id,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    u.class AS student_class,
    u.taz AS student_taz,

    -- Mentor Contact Details
    c.id AS contact_id,
    c.name AS mentor_name,
    c.email AS mentor_email,
    c.phone AS mentor_phone,
    c.specialty AS mentor_specialty,
    c.client_institution,
    c.client_training_center_info,

    -- Entry Counts for this specific mentor
    COALESCE(mes.approved_entries_count, 0) AS approved_entries_count,
    COALESCE(mes.unapproved_entries_count, 0) AS unapproved_entries_count,
    COALESCE(mes.total_entries_count, 0) AS total_entries_count

FROM contacts c
JOIN users u ON c.user_id = u.id
LEFT JOIN mentor_entry_stats mes ON mes.student_id = u.id AND mes.contact_id = c.id
WHERE c.type = 'mentor';