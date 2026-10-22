/*
# Discount code lookup for shoppers

1. New Functions
- `check_discount(p_code text)` returns the percent of an active, unexpired discount code that
  still has uses left, or NULL when the code is not valid.

2. Security
- SECURITY DEFINER so shoppers can validate a single code without being able to list the
  `discount_codes` table (which stays admin-only).
- Executable by anon and authenticated.
*/

CREATE OR REPLACE FUNCTION public.check_discount(p_code text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT percent FROM discount_codes
  WHERE code = upper(trim(p_code))
    AND active
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.check_discount(text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_discount(text) TO anon, authenticated;