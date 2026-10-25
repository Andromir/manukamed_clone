/*
# Lock down SECURITY DEFINER functions and internal tables

1. Function EXECUTE grants (security fix)
- `admin_exists`, `check_discount`, `is_admin`, `claim_first_admin`, `link_my_orders` were
  callable by `anon` and/or `authenticated` directly through the Data API.  Each is
  SECURITY DEFINER and runs with owner rights, so public reachability is an exposure.
- EXECUTE is revoked from `anon` and `authenticated` on all five.  Callers are re-routed:
  - `admin_exists` and `check_discount` go through the new `store-query` edge function
    (guest calls — the frontend can no longer reach the RPCs directly).
  - `is_admin`, `claim_first_admin`, `link_my_orders` keep only `service_role`; they are
    still used by edge functions and by the admin-manage flow, which verifies the caller
    server-side.  The frontend account page no longer calls `link_my_orders`; the account
    query path does not depend on it (orders are linked at checkout by create-order).
- No `GRANT` is issued for `admin_*`, `generate_invoice`, `create_order` — they were
  already owner/service-role only.

2. RLS policies on internal tables
- `payment_credentials` and `publish_log` had RLS enabled with zero policies (deny-all)
  but broad anon/authenticated table grants.  Explicit zero-policy tables are flagged by
  the security advisor; table grants are revoked so no client role can touch them.
  Access stays available to `service_role` (edge functions) and the table owner.

3. Notes
- Nothing is deleted; only grants and policies change.
- The `store-query` edge function deployed with this change calls `admin_exists` and
  `check_discount` with the service role, preserving existing behavior for guests.
*/

REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_discount(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_my_orders() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_discount(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.link_my_orders() TO service_role;

REVOKE ALL ON public.payment_credentials FROM anon, authenticated;
REVOKE ALL ON public.publish_log FROM anon, authenticated;