/*
# ManukaMed store schema

Creates everything the webstore and its admin dashboard need.

1. New Tables
- `admin_users` - which signed-in accounts are store administrators (user_id, email, created_at)
- `products` - catalog (slug, name, category, mgo, badge, short, description, images, variants [{size, price}],
  sale_price, stock, rating, reviews, how_to_use, taste, ingredients, allergy, nutrition, is_published,
  is_bestseller, sort_order, timestamps)
- `store_settings` - single row of store configuration (free shipping threshold, subscription discount,
  shipping methods, payment methods with on/off toggles and fees, bank transfer details, Google Analytics ID,
  store contact email)
- `payment_credentials` - secret API keys for Stripe / PayPal (mode, keys, verified_at). Never readable by
  the browser; only server functions can access it.
- `discount_codes` - discount codes (percent, active, expiry, max uses, used count)
- `orders` + `order_items` - customer orders and their lines
- `site_content` - editable page texts/images (key -> json value)

2. Security
- RLS enabled on every table.
- `is_admin()` helper checks the admin_users table for the current user.
- Public visitors may only read published products, store settings and site content.
- Orders, order items and discount codes are only visible to admins; orders are created by a server function.
- payment_credentials has no policies at all (server-only).
- `claim_first_admin()` lets the very first signed-in account become admin when no admin exists yet.
- `create_order()` is executable only by the server (service role); it atomically checks and reduces stock.
- Storage bucket `media` (public read, admin-only write) for uploaded images.

3. Notes
- Cancelling an order puts its items back in stock; un-cancelling removes them again.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()); $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  LOCK TABLE admin_users IN EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM admin_users) THEN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
  END IF;
  INSERT INTO admin_users (user_id, email)
  SELECT id, COALESCE(email, '') FROM auth.users WHERE id = auth.uid();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM admin_users); $$;
REVOKE ALL ON FUNCTION public.admin_exists() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

DROP POLICY IF EXISTS "admins_select_admins" ON admin_users;
CREATE POLICY "admins_select_admins" ON admin_users FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admins_insert_admins" ON admin_users;
CREATE POLICY "admins_insert_admins" ON admin_users FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_admins" ON admin_users;
CREATE POLICY "admins_delete_admins" ON admin_users FOR DELETE TO authenticated USING (is_admin() AND user_id <> auth.uid());

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'ostali-izdelki',
  mgo integer,
  badge text,
  short text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  sale_price numeric(10,2),
  stock integer NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 5,
  reviews integer NOT NULL DEFAULT 0,
  how_to_use text NOT NULL DEFAULT '',
  taste text NOT NULL DEFAULT '',
  ingredients text NOT NULL DEFAULT '',
  allergy text NOT NULL DEFAULT '',
  nutrition jsonb,
  is_published boolean NOT NULL DEFAULT true,
  is_bestseller boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_products" ON products;
CREATE POLICY "public_read_published_products" ON products FOR SELECT TO anon, authenticated USING (is_published OR is_admin());
DROP POLICY IF EXISTS "admins_insert_products" ON products;
CREATE POLICY "admins_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_update_products" ON products;
CREATE POLICY "admins_update_products" ON products FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_products" ON products;
CREATE POLICY "admins_delete_products" ON products FOR DELETE TO authenticated USING (is_admin());

-- Store settings (single row)
CREATE TABLE IF NOT EXISTS store_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  free_shipping_threshold numeric(10,2) NOT NULL DEFAULT 50,
  subscribe_discount numeric(5,2) NOT NULL DEFAULT 15,
  shipping_methods jsonb NOT NULL DEFAULT '[
    {"id":"posta","label":"Pošta Slovenije","eta":"1–2 delovna dneva","price":3.9,"enabled":true},
    {"id":"gls","label":"GLS dostava","eta":"1 delovni dan","price":4.9,"enabled":true},
    {"id":"prevzem","label":"Osebni prevzem – Ljubljana","eta":"Po dogovoru","price":0,"enabled":true}
  ]'::jsonb,
  payment_methods jsonb NOT NULL DEFAULT '{
    "cod":{"enabled":true,"label":"Plačilo po povzetju","fee":1.5,"description":"Plačilo z gotovino ali kartico ob prevzemu paketa."},
    "bank":{"enabled":true,"label":"Bančno nakazilo (UPN)","fee":0,"description":"Podatke za plačilo prejmete po oddaji naročila. Naročilo odpošljemo po prejemu plačila."},
    "stripe":{"enabled":false,"label":"Plačilna kartica","fee":0,"description":"Varno plačilo s kartico prek Stripe."},
    "paypal":{"enabled":false,"label":"PayPal","fee":0,"description":"Po oddaji naročila boste preusmerjeni na PayPal."}
  }'::jsonb,
  bank_details jsonb NOT NULL DEFAULT '{"recipient":"","iban":"","bic":"","bank":"","purpose":"Plačilo naročila"}'::jsonb,
  countries jsonb NOT NULL DEFAULT '["Slovenija","Hrvaška","Avstrija","Italija","Madžarska","Nemčija"]'::jsonb,
  ga_measurement_id text NOT NULL DEFAULT '',
  store_email text NOT NULL DEFAULT 'info@manukamed.si',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO store_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON store_settings;
CREATE POLICY "public_read_settings" ON store_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins_insert_settings" ON store_settings;
CREATE POLICY "admins_insert_settings" ON store_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_update_settings" ON store_settings;
CREATE POLICY "admins_update_settings" ON store_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Payment credentials (server only)
CREATE TABLE IF NOT EXISTS payment_credentials (
  provider text PRIMARY KEY CHECK (provider IN ('stripe','paypal')),
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test','live')),
  public_key text NOT NULL DEFAULT '',
  secret_key text NOT NULL DEFAULT '',
  verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payment_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON payment_credentials FROM anon, authenticated;

-- Discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
  code text PRIMARY KEY CHECK (code = upper(code) AND length(code) > 0),
  percent numeric(5,2) NOT NULL CHECK (percent > 0 AND percent <= 100),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO discount_codes (code, percent) VALUES ('DOBRODOSLI10', 10) ON CONFLICT (code) DO NOTHING;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_codes" ON discount_codes;
CREATE POLICY "admins_select_codes" ON discount_codes FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admins_insert_codes" ON discount_codes;
CREATE POLICY "admins_insert_codes" ON discount_codes FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_update_codes" ON discount_codes;
CREATE POLICY "admins_update_codes" ON discount_codes FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_codes" ON discount_codes;
CREATE POLICY "admins_delete_codes" ON discount_codes FOR DELETE TO authenticated USING (is_admin());

-- Orders
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('MM-' || nextval('order_number_seq')::text),
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('pending_payment','new','processing','shipped','completed','cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('cod','bank','stripe','paypal')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
  payment_ref text,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  address text NOT NULL,
  address2 text NOT NULL DEFAULT '',
  postal_code text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  shipping_method text NOT NULL,
  shipping_label text NOT NULL DEFAULT '',
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  payment_fee numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  discount_code text,
  total numeric(10,2) NOT NULL,
  newsletter boolean NOT NULL DEFAULT false,
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_orders" ON orders;
CREATE POLICY "admins_select_orders" ON orders FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admins_update_orders" ON orders;
CREATE POLICY "admins_update_orders" ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_orders" ON orders;
CREATE POLICY "admins_delete_orders" ON orders FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  size text NOT NULL,
  image text NOT NULL DEFAULT '',
  qty integer NOT NULL CHECK (qty > 0),
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  subscribe boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items(product_id);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_order_items" ON order_items;
CREATE POLICY "admins_select_order_items" ON order_items FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admins_update_order_items" ON order_items;
CREATE POLICY "admins_update_order_items" ON order_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_order_items" ON order_items;
CREATE POLICY "admins_delete_order_items" ON order_items FOR DELETE TO authenticated USING (is_admin());

-- Server-only order creation with atomic stock check
CREATE OR REPLACE FUNCTION public.create_order(p_order jsonb, p_items jsonb)
RETURNS orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  o orders;
  item jsonb;
  updated integer;
BEGIN
  INSERT INTO orders (status, payment_method, email, first_name, last_name, phone, address, address2, postal_code, city,
    country, shipping_method, shipping_label, shipping_cost, payment_fee, subtotal, discount, discount_code, total, newsletter)
  SELECT * FROM jsonb_to_record(p_order) AS x(status text, payment_method text, email text, first_name text, last_name text,
    phone text, address text, address2 text, postal_code text, city text, country text, shipping_method text,
    shipping_label text, shipping_cost numeric, payment_fee numeric, subtotal numeric, discount numeric,
    discount_code text, total numeric, newsletter boolean)
  RETURNING * INTO o;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE products SET stock = stock - (item->>'qty')::int, updated_at = now()
      WHERE id = (item->>'product_id')::uuid AND stock >= (item->>'qty')::int;
    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated = 0 THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', item->>'name';
    END IF;
    INSERT INTO order_items (order_id, product_id, slug, name, size, image, qty, unit_price, total, subscribe)
    VALUES (o.id, (item->>'product_id')::uuid, item->>'slug', item->>'name', item->>'size', COALESCE(item->>'image',''),
      (item->>'qty')::int, (item->>'unit_price')::numeric, (item->>'total')::numeric, COALESCE((item->>'subscribe')::boolean, false));
  END LOOP;

  IF o.discount_code IS NOT NULL THEN
    UPDATE discount_codes SET used_count = used_count + 1 WHERE code = o.discount_code;
  END IF;
  RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order(jsonb, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.orders_restock()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE products p SET stock = p.stock + i.qty FROM order_items i WHERE i.order_id = NEW.id AND i.product_id = p.id;
  ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    UPDATE products p SET stock = p.stock - i.qty FROM order_items i WHERE i.order_id = NEW.id AND i.product_id = p.id;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.orders_restock() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS orders_restock_trg ON orders;
CREATE TRIGGER orders_restock_trg BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION orders_restock();

-- Site content
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_content" ON site_content;
CREATE POLICY "public_read_content" ON site_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins_insert_content" ON site_content;
CREATE POLICY "admins_insert_content" ON site_content FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_update_content" ON site_content;
CREATE POLICY "admins_update_content" ON site_content FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins_delete_content" ON site_content;
CREATE POLICY "admins_delete_content" ON site_content FOR DELETE TO authenticated USING (is_admin());

-- Media storage
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admins_upload_media" ON storage.objects;
CREATE POLICY "admins_upload_media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin());
DROP POLICY IF EXISTS "admins_update_media" ON storage.objects;
CREATE POLICY "admins_update_media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_admin()) WITH CHECK (bucket_id = 'media' AND public.is_admin());
DROP POLICY IF EXISTS "admins_delete_media" ON storage.objects;
CREATE POLICY "admins_delete_media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_admin());
DROP POLICY IF EXISTS "admins_select_media" ON storage.objects;
CREATE POLICY "admins_select_media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND public.is_admin());
