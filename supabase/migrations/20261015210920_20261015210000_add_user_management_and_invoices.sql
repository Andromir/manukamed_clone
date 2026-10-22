/*
# User management, customer accounts, and PDF invoices

1. New Tables
- `profiles` — customer profile data linked to auth.users (id, first_name, last_name, phone, address, address2, postal_code, city, country, newsletter, updated_at)
- `invoices` — generated invoices for orders (id, order_id, invoice_number, issue_date, created_at)

2. Modified Tables
- `orders` — adds `invoice_number` (text, unique), `invoice_issued_at` (timestamptz), `user_id` (uuid, links order to a registered customer)
- `admin_users` — adds UPDATE policy so admins can update admin emails

3. Security
- `profiles`: RLS enabled. Each authenticated user can read and update only their own profile row. Admins can read all profiles.
- `orders`: adds SELECT policy for customers to see their own orders (by user_id or email match). Adds INSERT policy so customer sign-up can associate orders.
- `order_items`: adds SELECT policy for customers to see items of their own orders.
- `invoices`: RLS enabled. Admins can manage invoices; customers can view invoices for their own orders.

4. New Functions
- `admin_list_users()` — SECURITY DEFINER, returns all auth.users with profile data and admin flag. Admin-only.
- `admin_create_user(p_email, p_password, p_is_admin, p_first_name, p_last_name)` — SECURITY DEFINER, creates a new auth user and optionally adds to admin_users. Admin-only.
- `admin_reset_password(p_email)` — SECURITY DEFINER, sends a password reset email. Admin-only.
- `admin_remove_admin(p_user_id)` — SECURITY DEFINER, removes admin rights. Admin-only, cannot remove self.
- `admin_add_admin(p_user_id)` — SECURITY DEFINER, adds admin rights to existing user. Admin-only.
- `generate_invoice(p_order_id)` — SECURITY DEFINER, generates invoice number and date for an order. Admin-only.

5. Important Notes
- profiles.id defaults to auth.uid() and references auth.users(id).
- Customer order visibility: customers can see orders where user_id matches their auth ID OR where the order email matches their auth email (for orders placed before account creation).
- Invoice numbers follow Slovenian format: RAC-YYYY-NNNN (e.g., RAC-2026-0001).
- The invoice sequence resets each year.
*/
-- ============ profiles table ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  address2 text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  newsletter boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============ Add user_id and invoice columns to orders ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_number') THEN
    ALTER TABLE orders ADD COLUMN invoice_number text UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_issued_at') THEN
    ALTER TABLE orders ADD COLUMN invoice_issued_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_invoice_number_idx ON orders(invoice_number);

-- ============ Customer order visibility policies ============
DROP POLICY IF EXISTS "customers_select_own_orders" ON orders;
CREATE POLICY "customers_select_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "customers_select_own_order_items" ON order_items;
CREATE POLICY "customers_select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR public.is_admin())
    )
  );

-- Allow customers to update their own order's user_id (for linking orders to account on first login)
DROP POLICY IF EXISTS "customers_link_own_orders" ON orders;
CREATE POLICY "customers_link_own_orders" ON orders FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ============ Admin user management functions ============

-- List all users with profile and admin info
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  is_admin boolean,
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    u.id,
    u.email,
    COALESCE(p.first_name, '') AS first_name,
    COALESCE(p.last_name, '') AS last_name,
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = u.id) AS is_admin,
    u.created_at
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Create a new user (admin or regular)
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

  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    extensions.uuid_generate_v4(),
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
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, boolean, text, text) TO authenticated;

-- Send password reset email
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
  -- Generate a recovery token
  PERFORM auth.send_email_to_user(v_user_id, 'recovery');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_password(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(text) TO authenticated;

-- Add admin rights to existing user
CREATE OR REPLACE FUNCTION public.admin_add_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Dostop zavrnjen.'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Uporabnik ni najden.'; END IF;
  INSERT INTO admin_users (user_id, email) VALUES (p_user_id, v_email)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_add_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_admin(uuid) TO authenticated;

-- Remove admin rights
CREATE OR REPLACE FUNCTION public.admin_remove_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Dostop zavrnjen.'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'Ne morete odstraniti lastnih skrbniških pravic.'; END IF;
  DELETE FROM admin_users WHERE user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_remove_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_admin(uuid) TO authenticated;

-- Generate invoice for an order
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
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Dostop zavrnjen.'; END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Naročilo ni najdeno.'; END IF;

  -- If invoice already exists, return existing
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
GRANT EXECUTE ON FUNCTION public.generate_invoice(uuid) TO authenticated;

-- ============ Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
