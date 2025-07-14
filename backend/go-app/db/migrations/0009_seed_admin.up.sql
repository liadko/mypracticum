-- Insert a super-admin user and grant them the “admin” role.

-- 1) Insert the admin user. Replace the UUID and email as needed.
INSERT INTO users (id, first_name, last_name, email, signature, created_at)
VALUES (
  'e7a20c2a-460c-4f5e-9c5a-123456789abc',  -- choose a stable UUID for your admin
  'Liad',
  'Koren',
  'liad@example.com',
  NULL,                                     -- no signature yet
  now()
);

-- 2) Grant the “admin” role by looking up its role_id
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users AS u
JOIN roles AS r ON r.name = 'admin'
WHERE u.email = 'liadkoren@gmail.com';