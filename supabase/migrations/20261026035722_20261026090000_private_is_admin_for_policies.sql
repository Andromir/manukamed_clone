/*
# Restore admin checks used by permission rules (private schema)

1. Problem
- The 2026-10-25 lockdown revoked EXECUTE on `public.is_admin()` from `anon` and
  `authenticated`.  29 RLS policies (products, orders, order_items, discount_codes,
  store_settings, site_content, profiles, admin_users, storage media) call
  `is_admin()`, and policies run as the requesting role, so every query on those
  tables failed with "permission denied for function is_admin".  Effects: storefront
  showed no products, admin could not add/edit products or use other admin pages.

2. Fix
- New schema `private` (not exposed via the Data API) containing
  `private.is_admin()` - same logic: SECURITY DEFINER, fixed search_path, returns
  whether `auth.uid()` is in `admin_users`.
- `anon` and `authenticated` get USAGE on the schema and EXECUTE on the function so
  policies can evaluate it.  Because the schema is not exposed, it cannot be called
  as an RPC from the browser.
- Every policy in `public` and `storage` that referenced `is_admin()` is rewritten
  in place (ALTER POLICY, no drop) to call `private.is_admin()`.  Policy names,
  commands, roles, and all other conditions are unchanged.
- `public.is_admin()` stays revoked from client roles; it remains for `service_role`.

3. Data safety
- No tables, columns, or rows are changed.  Idempotent: safe to re-run.
*/

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()); $function$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (coalesce(qual, '') ~ '(^|[^.\w])is_admin\(\)'
        OR coalesce(with_check, '') ~ '(^|[^.\w])is_admin\(\)')
  LOOP
    new_qual := regexp_replace(p.qual, '(^|[^.\w])is_admin\(\)', '\1private.is_admin()', 'g');
    new_check := regexp_replace(p.with_check, '(^|[^.\w])is_admin\(\)', '\1private.is_admin()', 'g');
    stmt := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;