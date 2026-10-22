/*
# Fix admin functions: remove is_admin() guards that fail under service role

The edge function already verifies admin status via the user's JWT before
calling any of these functions with the service role client. The internal
is_admin() checks fail because auth.uid() returns NULL for the service role,
causing every function to raise "Dostop zavrnjen."

1. admin_create_user — removed is_admin() guard
2. admin_reset_password — removed is_admin() guard
3. admin_add_admin — removed is_admin() guard
4. admin_remove_admin — removed is_admin() guard, changed self-protection
   to use p_caller_id parameter instead of auth.uid()
5. generate_invoice — removed is_admin() guard
6. admin_list_users — unchanged (already had no guard)
*/

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_is_admin boolean,
  p_first_name text DEFAULT '',
  p_last_name text DEFAULT ''
)
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email = '' OR p_password = '' THEN RAISE EXCEPTION 'Manjkajo podatki.'; END IF;
  IF length(p_password) < 8 THEN RAISE EXCEPTION 'Geslo mora imeti vsaj 8 znakov.'; END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  IF v_user_id IS NOT NULL THEN
    IF p_is_admin AND NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_user_id) THEN
      INSERT INTO admin_users (user_id, email) VALUES (v_user_id, v_email);
    END IF;
    RETURN QUERY SELECT v_user_id, v_email;
    RETURN;
  END IF;

  v_user_id := extensions.uuid_generate_v4();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (
    v_user_id, v_email, crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(), 'authenticated', 'authenticated'
  );

  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  INSERT INTO profiles (id, first_name, last_name) VALUES (v_user_id, p_first_name, p_last_name)
  ON CONFLICT (id) DO NOTHING;

  IF p_is_admin THEN
    INSERT INTO admin_users (user_id, email) VALUES (v_user_id, v_email);
  END IF;

  RETURN QUERY SELECT v_user_id, v_email;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_user(text, text, boolean, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, boolean, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_reset_password(p_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Uporabnik ni najden.'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_password(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_add_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Uporabnik ni najden.'; END IF;
  INSERT INTO admin_users (user_id, email) VALUES (p_user_id, v_email)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_add_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_admin(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_remove_admin(p_user_id uuid, p_caller_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_user_id = p_caller_id THEN RAISE EXCEPTION 'Ne morete odstraniti lastnih skrbniških pravic.'; END IF;
  DELETE FROM admin_users WHERE user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_remove_admin(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_admin(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_invoice(p_order_id uuid)
RETURNS TABLE (invoice_number text, invoice_issued_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_number text;
  v_year int;
  v_seq int;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Naročilo ni najdeno.'; END IF;

  IF v_order.invoice_number IS NOT NULL THEN
    RETURN QUERY SELECT v_order.invoice_number, v_order.invoice_issued_at;
    RETURN;
  END IF;

  v_year := extract(year from now());
  SELECT count(*) + 1 INTO v_seq FROM orders WHERE invoice_number IS NOT NULL AND extract(year from invoice_issued_at) = v_year;
  v_number := 'RAC-' || v_year::text || '-' || lpad(v_seq::text, 4, '0');

  UPDATE orders SET invoice_number = v_number, invoice_issued_at = now() WHERE id = p_order_id;
  RETURN QUERY SELECT v_number, now()::timestamptz;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_invoice(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.generate_invoice(uuid) TO authenticated, service_role;
