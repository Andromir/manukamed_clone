/*
# Create test admin user

1. Purpose
- Seeds a test admin account so the admin dashboard can be accessed immediately
  without going through the "create first admin" sign-up flow.

2. Credentials
- Email: admin@brandspot.si
- Password: Brandspot2025!

3. Security
- The row in admin_users grants this user admin privileges via the is_admin() function.
- This is a test account — change the password or delete the user after testing.
*/

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  encrypted_password,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@brandspot.si',
  now(),
  '$2a$10$gly.uKodTnmsrT7yIii./O1UPbb5MwyE5mVICzV7sv/XgYk5YxqTq',
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  false,
  false
);

INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'admin@brandspot.si';