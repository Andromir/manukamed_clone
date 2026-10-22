/*
# Lock admin functions to the server and fix invoice numbering

1. Security
   - admin_list_users, admin_add_admin, admin_remove_admin, generate_invoice
     are now executable ONLY by service_role (the admin-manage edge function,
     which verifies the caller is an admin first). Signed-in shoppers can no
     longer call them directly.
2. Removed functions (no data affected)
   - admin_create_user: users are now created through the official auth admin API.
   - admin_reset_password: unused.
   - admin_remove_admin(uuid): old overload replaced by (uuid, uuid).
3. Fixes
   - generate_invoice: output column names clashed with orders columns
     ("column reference is ambiguous"); resolved with variable_conflict use_column.
*/

DROP FUNCTION IF EXISTS public.admin_create_user(text, text, boolean, text, text);
DROP FUNCTION IF EXISTS public.admin_reset_password(text);
DROP FUNCTION IF EXISTS public.admin_remove_admin(uuid);

CREATE OR REPLACE FUNCTION public.generate_invoice(p_order_id uuid)
RETURNS TABLE (invoice_number text, invoice_issued_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_existing_number text;
  v_existing_at timestamptz;
  v_found boolean;
  v_number text;
  v_year int := extract(year from now())::int;
  v_seq int;
  v_now timestamptz := now();
BEGIN
  SELECT o.invoice_number, o.invoice_issued_at, true
    INTO v_existing_number, v_existing_at, v_found
  FROM orders o WHERE o.id = p_order_id
  FOR UPDATE;
  IF v_found IS NULL THEN RAISE EXCEPTION 'Naročilo ni najdeno.'; END IF;

  IF v_existing_number IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_number, v_existing_at;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('generate_invoice'));
  SELECT count(*) + 1 INTO v_seq FROM orders o
  WHERE o.invoice_number IS NOT NULL AND extract(year from o.invoice_issued_at) = v_year;
  v_number := 'RAC-' || v_year::text || '-' || lpad(v_seq::text, 4, '0');

  UPDATE orders o SET invoice_number = v_number, invoice_issued_at = v_now WHERE o.id = p_order_id;
  RETURN QUERY SELECT v_number, v_now;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_add_admin(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_remove_admin(uuid, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_invoice(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_remove_admin(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_invoice(uuid) TO service_role;
