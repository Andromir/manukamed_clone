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

-- This migration intentionally does not seed an auth user.
-- Create administrators through the app's Supabase Auth flow instead.