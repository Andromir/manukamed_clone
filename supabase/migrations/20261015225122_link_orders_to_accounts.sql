/*
# Link orders to customer accounts

1. Modified functions
- `create_order(p_order, p_items)` now also reads an optional `user_id` from `p_order`
  and stores it on the new order. Still callable only by the server (service role).
- New `link_my_orders()` (SECURITY DEFINER, authenticated only): attaches every
  order that has no owner yet and was placed with the signed-in user's email to
  that user. Returns how many orders were linked.

2. Security
- Removed policy `customers_link_own_orders`. It let a customer UPDATE any column
  (status, totals, payment status) of unlinked orders matching their email; only
  the owner field was checked. Linking now happens through `link_my_orders()`,
  which can change nothing except the owner field.

3. Data
- Existing orders without an owner are linked to the account with the same email.
- Index on `orders.user_id` for account order lookups.
*/

CREATE OR REPLACE FUNCTION public.create_order(p_order jsonb, p_items jsonb)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
o orders;
item jsonb;
updated integer;
BEGIN
INSERT INTO orders (status, payment_method, email, first_name, last_name, phone, address, address2, postal_code, city,
country, shipping_method, shipping_label, shipping_cost, payment_fee, subtotal, discount, discount_code, total, newsletter, user_id)
SELECT * FROM jsonb_to_record(p_order) AS x(status text, payment_method text, email text, first_name text, last_name text,
phone text, address text, address2 text, postal_code text, city text, country text, shipping_method text,
shipping_label text, shipping_cost numeric, payment_fee numeric, subtotal numeric, discount numeric,
discount_code text, total numeric, newsletter boolean, user_id uuid)
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
$function$;

REVOKE ALL ON FUNCTION public.create_order(jsonb, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, jsonb) TO service_role;

DROP POLICY IF EXISTS "customers_link_own_orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.link_my_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
v_email text;
v_count integer;
BEGIN
IF auth.uid() IS NULL THEN
RETURN 0;
END IF;
SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = auth.uid();
IF v_email IS NULL THEN
RETURN 0;
END IF;
UPDATE orders SET user_id = auth.uid(), updated_at = now()
WHERE user_id IS NULL AND lower(email) = v_email;
GET DIAGNOSTICS v_count = ROW_COUNT;
RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.link_my_orders() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.link_my_orders() TO authenticated;

UPDATE public.orders o SET user_id = u.id
FROM auth.users u
WHERE o.user_id IS NULL AND lower(o.email) = lower(u.email);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
