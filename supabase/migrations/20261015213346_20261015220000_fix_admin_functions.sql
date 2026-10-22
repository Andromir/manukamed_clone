/*
# Fix admin functions: create_user, reset_password, and create_order compatibility

1. Fix admin_create_user: add missing provider_id column in auth.identities insert
2. Fix admin_reset_password: remove non-existent auth.send_email_to_user call, let edge function handle via Admin API
3. No schema changes — only function body updates
*/

-- ============ Fix admin_create_user ============
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
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Dostop zavrnjen.'; END IF;
  IF v_email = '' OR p_password = '' THEN RAISE EXCEPTION 'Manjkajo podatki.'; END IF;
  IF length(p_password) < 8 THEN RAISE EXCEPTION 'Geslo mora imeti vsaj 8 znakov.'; END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  IF v_user_id IS NOT NULL THEN
    IF p_is_admin AND NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_user_id) THEN
      INSERT INTO admin_users (user_id, email) VALUES (v_user_id, v_email);
    END IF;
    RETURN QUERY SELECT v_user_id, v_email;
    RETURN;
  END IF;

  -- Create new auth user
  v_user_id := extensions.uuid_generate_v4();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (
    v_user_id,
    v_email,
    crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Insert identity with all required columns
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Insert profile
  INSERT INTO profiles (id, first_name, last_name) VALUES (v_user_id, p_first_name, p_last_name)
  ON CONFLICT (id) DO NOTHING;

  -- Add admin if requested
  IF p_is_admin THEN
    INSERT INTO admin_users (user_id, email) VALUES (v_user_id, v_email);
  END IF;

  RETURN QUERY SELECT v_user_id, v_email;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_user(text, text, boolean, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, boolean, text, text) TO authenticated, service_role;

-- ============ Fix admin_reset_password ============
-- Remove the broken auth.send_email_to_user call; the edge function handles
-- password resets via the Supabase Admin API (generateRecoveryLink)
CREATE OR REPLACE FUNCTION public.admin_reset_password(p_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Dostop zavrnjen.'; END IF;
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Uporabnik ni najden.'; END IF;
  -- The edge function sends the recovery link via the Admin API;
  -- this function only validates that the user exists and the caller is admin.
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_password(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(text) TO authenticated, service_role;
