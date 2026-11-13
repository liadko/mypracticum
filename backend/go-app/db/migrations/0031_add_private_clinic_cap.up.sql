-- Private-clinic hours cap (#20), set per class. Every existing class gets 160.
--
-- Apply BEFORE deploying the code that reads it. Older code ignores the column.
--
-- What counts toward the cap: calendar entries on client contacts whose
-- metadata says clientInstitution = privateClinic. Manual (admin) hours do not.
ALTER TABLE classes
    ADD COLUMN private_clinic_cap INT NOT NULL DEFAULT 160
        CONSTRAINT classes_private_clinic_cap_non_negative CHECK (private_clinic_cap >= 0);
