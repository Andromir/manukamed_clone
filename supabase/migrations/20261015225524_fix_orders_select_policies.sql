/*
# Fix order read access for signed-in users and admins

1. Problem
- `customers_select_own_orders` and `customers_select_own_order_items` looked up the
  caller's email in `auth.users`, which signed-in users cannot read. Every SELECT on
  orders by a signed-in user (including admins on the dashboard) failed with
  "permission denied for table users".

2. Security changes
- Customers now read orders they own (`user_id = auth.uid()`); admins read all.
- Guest orders placed with the customer's email are attached to their account by
  `link_my_orders()` when they open their account page, so matching by email in the
  policy is no longer needed.
*/

DROP POLICY IF EXISTS "customers_select_own_orders" ON public.orders;
CREATE POLICY "customers_select_own_orders" ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "customers_select_own_order_items" ON public.order_items;
CREATE POLICY "customers_select_own_order_items" ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR is_admin())
  )
);
