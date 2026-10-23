/*
# Add publish fields and publish_log table

1. New Columns on `products`
- `revision` (integer, nullable) — monotonically increasing revision number from the Publisher.
  The edge function uses this to ignore stale updates: an incoming revision is only applied
  if it is higher than the stored value (or the row doesn't exist yet).
- `delivery_date` (date, nullable) — expected delivery date sent by the Publisher.
- `specs` (jsonb, nullable) — structured product specifications (e.g. screen, CPU, RAM) sent
  by the Publisher.  Stored separately from the existing `nutrition` jsonb so the storefront
  can render them independently.

2. New Table: `publish_log`
- Records every call to the `brandspot-publish` edge function for auditing.
- Columns: `id` (uuid PK), `product_id` (text — the slug/key the Publisher sent),
  `revision` (integer), `status` (text: 'applied' | 'stale' | 'error'),
  `message` (text, nullable — extra detail), `created_at` (timestamptz default now()).

3. Security
- `publish_log` has RLS enabled.  Only `service_role` can access it (the edge function uses
  the service role key).  No anon or authenticated grants — this table is internal.
- `products` already has RLS and policies from the initial migration; those are unchanged.
- `service_role` already has access to `products` by default (it bypasses RLS).
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS revision integer,
  ADD COLUMN IF NOT EXISTS delivery_date date,
  ADD COLUMN IF NOT EXISTS specs jsonb;

CREATE TABLE IF NOT EXISTS publish_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  revision integer,
  status text NOT NULL DEFAULT 'applied',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT ON publish_log TO service_role;