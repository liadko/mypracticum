CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    client_start_date DATE,
    mentor_start_date DATE,
    therapist_start_date DATE,
    CONSTRAINT classes_name_trimmed_and_non_empty CHECK (name = BTRIM(name) AND name <> '')
);

ALTER TABLE users
    ADD COLUMN class_id UUID,
    ADD CONSTRAINT users_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE NO ACTION;
