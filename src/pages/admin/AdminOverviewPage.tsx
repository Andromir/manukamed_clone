import { AlertTriangle, ArrowRight, Euro, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import SalesChart from '@/components/admin/SalesChart';
import { OrderStatusBadge } from '@/components/admin/StatusBadge';
import { Card, LoadingBlock, Notice, PageHeader } from '@/components/admin/ui';
import { formatDateTime, formatEur, type Order } from '@/data/orders';
import { dailySeries, loadStatsOrders, summarize, type StatsOrder } from '@/lib/salesStats';
import { supabase } from '@/lib/supabase';

type RecentOrder = Pick<Order, 'id' | 'order_number' | 'first_name' | 'last_name' | 'total' | 'status' | 'created_at'>;
type LowStock = { id: string; name: string; stock: number };

function Stat({ label, value, Icon, hint }: { label: string; value: string; Icon: ComponentType<{ className?: string }>; hint?: string }) {
  return (
    <div className="admin-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-800/60">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-medium tracking-tight text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-800/50">{hint}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsOrder[] | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [toProcess, setToProcess] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [orders, recentRes, stockRes, newRes] = await Promise.all([
          loadStatsOrders(30),
          supabase.from('orders').select('id, order_number, first_name, last_name, total, status, created_at').order('created_at', { ascending: false }).limit(6),
          supabase.from('products').select('id, name, stock').lte('stock', 3).order('stock').limit(6),
          supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['new', 'processing']),
        ]);
        if (recentRes.error || stockRes.error || newRes.error) throw new Error('Podatkov ni bilo mogoče naložiti.');
        setStats(orders);
        setRecent((recentRes.data ?? []) as RecentOrder[]);
        setLowStock((stockRes.data ?? []) as LowStock[]);
        setToProcess(newRes.count ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Napaka pri nalaganju.');
      }
    })();
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!stats) return <LoadingBlock />;

  const summary = summarize(stats);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Pregled" description="Prodaja v zadnjih 30 dneh in stvari, ki potrebujejo vašo pozornost." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Prihodki" value={formatEur(summary.revenue)} Icon={Euro} hint="Zadnjih 30 dni" />
        <Stat label="Naročila" value={String(summary.orders)} Icon={ShoppingBag} hint="Brez preklicanih" />
        <Stat label="Povprečna košarica" value={formatEur(summary.average)} Icon={TrendingUp} />
        <Stat label="Za obdelavo" value={String(toProcess)} Icon={Package} hint="Nova in v obdelavi" />
      </div>

      <div className="mt-6">
        <Card title="Prihodki po dnevih">
          <SalesChart data={dailySeries(stats, 30)} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Zadnja naročila"
            actions={
              <Link to="/admin/narocila" className="inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-900">
                Vsa naročila <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-navy-800/50">Še ni naročil.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-navy-50">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link to={`/admin/narocila/${o.id}`} className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-navy-50/60">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">
                          {o.order_number} · {o.first_name} {o.last_name}
                        </p>
                        <p className="text-xs text-navy-800/50">{formatDateTime(o.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <OrderStatusBadge status={o.status} />
                        <span className="w-20 text-right text-sm font-medium text-navy-900">{formatEur(Number(o.total))}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Nizka zaloga" description="Izdelki s 3 kosi ali manj.">
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy-800/50">Vse zaloge so v redu.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/izdelki/${p.id}`} className="flex items-center justify-between gap-3 text-sm hover:text-navy-700">
                    <span className="flex min-w-0 items-center gap-2 text-navy-900">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className={`shrink-0 font-medium ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock} kos</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
