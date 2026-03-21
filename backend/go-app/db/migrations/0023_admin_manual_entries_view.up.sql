-- migrations/0023_admin_manual_entries_view.up.sql

CREATE OR REPLACE VIEW admin_manual_entries AS
SELECT
    -- Manual Entry Details
    me.id AS manual_entry_id,
    me.hours AS entry_hours,
    me.cause AS entry_cause,
    me.type AS entry_type,
    me.created_at AS entry_created_at,
    me.batch_id,

    -- Student Details
    u.id AS student_id,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    u.class AS student_class,
    u.taz AS student_taz

FROM manual_entries me
JOIN users u ON me.user_id = u.id;