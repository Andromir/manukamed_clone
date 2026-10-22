import { REVENUE_STATUSES, type Order } from '@/data/orders';
import { supabase } from '@/lib/supabase';

export type StatsOrder = Pick<Order, 'id' | 'created_at' | 'total' | 'status' | 'payment_method'> & {
  order_items: { name: string; slug: string; qty: number; total: number }[];
};

export interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

export async function loadStatsOrders(days: number): Promise<StatsOrder[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, total, status, payment_method, order_items(name, slug, qty, total)')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw new Error('Podatkov o prodaji ni bilo mogoče naložiti.');
  return (data ?? []) as StatsOrder[];
}

export const countsAsSale = (o: { status: string }) => REVENUE_STATUSES.includes(o.status as Order['status']);

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function dailySeries(orders: StatsOrder[], days: number): DayPoint[] {
  const map = new Map<string, DayPoint>();
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = dayKey(cursor);
    map.set(key, { date: key, revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const o of orders) {
    if (!countsAsSale(o)) continue;
    const point = map.get(dayKey(new Date(o.created_at)));
    if (!point) continue;
    point.revenue += Number(o.total);
    point.orders += 1;
  }
  return [...map.values()];
}

export function summarize(orders: StatsOrder[]) {
  const sales = orders.filter(countsAsSale);
  const revenue = sales.reduce((s, o) => s + Number(o.total), 0);
  return {
    revenue,
    orders: sales.length,
    average: sales.length ? revenue / sales.length : 0,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };
}

export function topProducts(orders: StatsOrder[], limit = 5) {
  const map = new Map<string, { name: string; slug: string; qty: number; revenue: number }>();
  for (const o of orders.filter(countsAsSale)) {
    for (const item of o.order_items) {
      const row = map.get(item.slug) ?? { name: item.name, slug: item.slug, qty: 0, revenue: 0 };
      row.qty += item.qty;
      row.revenue += Number(item.total);
      map.set(item.slug, row);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function paymentBreakdown(orders: StatsOrder[]) {
  const map = new Map<string, { method: string; orders: number; revenue: number }>();
  for (const o of orders.filter(countsAsSale)) {
    const row = map.get(o.payment_method) ?? { method: o.payment_method, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += Number(o.total);
    map.set(o.payment_method, row);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
