ALTER TABLE contacts
    ADD COLUMN mentorship_type TEXT,
    ADD COLUMN client_institution TEXT,
    ADD COLUMN client_training_center_info TEXT;

-- Initialize mentors with default mentorship_type
UPDATE contacts
   SET mentorship_type = 'individual'
 WHERE type = 'mentor';

-- Initialize clients with default institution
UPDATE contacts
   SET client_institution = 'privateClinic'
 WHERE type = 'client';
