/*
# Server-side first-admin claim and admin check

1. Why
- The previous migration revoked public EXECUTE on `claim_first_admin` and `is_admin`.
  The admin login page and auth context still called both directly from the browser,
  which made admin login fail ("Database error querying schema").
- The browser is untrusted, so these checks must run server-side.  The new
  `store-query` edge function verifies the caller's session with the anon key + the
  Authorization header, then performs the check/claim with the service role.

2. What
- `claim_first_admin_by_user(p_user_id uuid, p_email text)`: replaces the session-based
  `claim_first_admin()`.  It is service_role-only and takes the already-verified user id
  from the edge function (never from the browser body).  Same atomic claim semantics:
  locks `admin_users`, returns true only if the table was empty or the caller already is
  admin.
- `is_admin_user(p_user_id uuid)`: service_role-only variant of `is_admin()` that checks
  a verified user id.
- `claim_first_admin()` is dropped — no remaining callers.
- Both new functions are SECURITY DEFINER with a fixed search_path and EXECUTE granted
  only to `service_role`.

3. Data safety
- No tables, columns, or rows are changed or removed.
*/

CREATE OR REPLACE FUNCTION public.claim_first_admin_by_user(p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
IF p_user_id IS NULL THEN
RETURN false;
END IF;
LOCK TABLE admin_users IN EXCLUSIVE MODE;
IF EXISTS (SELECT 1 FROM admin_users) THEN
RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id);
END IF;
INSERT INTO admin_users (user_id, email)
VALUES (p_user_id, COALESCE(p_email, ''));
RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id); $function$;

REVOKE ALL ON FUNCTION public.claim_first_admin_by_user(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin_by_user(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.claim_first_admin();