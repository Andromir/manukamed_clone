/*
# Add service_role policies to internal tables

1. Purpose
- Clears the "RLS Enabled No Policy" advisor finding on `payment_credentials` and
  `publish_log` without exposing any data to `anon` or `authenticated`.
- Both tables are internal: `payment_credentials` holds payment provider keys and is read
  only by edge functions; `publish_log` is written by the `brandspot-publish` function.
- A policy scoped TO `service_role` documents the intended access pattern explicitly;
  client roles still have no grants (revoked in the previous migration) and no policies,
  so they remain fully denied.

2. Security
- RLS stays enabled on both tables.
- No `anon` / `authenticated` access is added.
*/

CREATE POLICY "service_role_all_payment_credentials"
ON public.payment_credentials FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_all_publish_log"
ON public.publish_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);