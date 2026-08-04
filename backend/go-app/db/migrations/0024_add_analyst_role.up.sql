INSERT INTO roles (name)
VALUES ('analyst')
ON CONFLICT (name) DO NOTHING;
