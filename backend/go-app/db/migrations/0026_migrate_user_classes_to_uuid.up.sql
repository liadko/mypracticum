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

ALTER TABLE users DROP COLUMN class;
