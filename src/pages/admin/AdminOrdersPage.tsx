import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/StatusBadge';
import { LoadingBlock, Notice, PageHeader } from '@/components/admin/ui';
import { formatDateTime, formatEur, ORDER_STATUSES, PAYMENT_METHOD_LABELS, type Order } from '@/data/orders';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 25;

type Row = Pick<Order, 'id' | 'order_number' | 'first_name' | 'last_name' | 'email' | 'total' | 'status' | 'payment_status' | 'payment_method' | 'created_at' | 'user_id'>;

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Math.max(0, Number(params.get('stran') ?? 0));
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== query) update({ q: query, stran: '' });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    setRows(null);
    let req = supabase
      .from('orders')
      .select('id, order_number, first_name, last_name, email, total, status, payment_status, payment_method, created_at, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (status) req = req.eq('status', status);
    const q = (params.get('q') ?? '').trim().replace(/[,()%]/g, ' ');
    if (q) req = req.or(`order_number.ilike.%${q}%,email.ilike.%${q}%,last_name.ilike.%${q}%,first_name.ilike.%${q}%`);
    req.then(({ data, error: err, count: total }) => {
      if (err) return setError('Naročil ni bilo mogoče naložiti.');
      setError('');
      setRows((data ?? []) as Row[]);
      setCount(total ?? 0);
    });
  }, [status, page, params]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Naročila" description={`${count} naročil`} actions={
        <button type="button" onClick={() => navigate('/admin/narocila/ustvari')} className="admin-btn">
          <Plus className="h-4 w-4" /> Novo naročilo
        </button>
      } />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Številka, ime ali e-pošta" className="admin-input pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-navy-100 bg-white p-1">
          {[{ id: '', label: 'Vsa' }, ...ORDER_STATUSES].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => update({ status: s.id, stran: '' })}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s.id ? 'bg-navy-900 text-white' : 'text-navy-800/70 hover:bg-navy-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {!rows ? (
        <LoadingBlock />
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-navy-100 bg-navy-50/50 text-left text-xs uppercase tracking-wider text-navy-800/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Naročilo</th>
                  <th className="px-4 py-3 font-medium">Kupec</th>
                  <th className="px-4 py-3 font-medium">Plačilo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Znesek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((o) => (
                  <tr key={o.id} className="group transition-colors hover:bg-navy-50/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/narocila/${o.id}`} className="block">
                        <span className="font-medium text-navy-900 group-hover:underline">{o.order_number}</span>
                        <span className="block text-xs text-navy-800/50">{formatDateTime(o.created_at)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-navy-900">
                        {o.first_name} {o.last_name}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                            o.user_id ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-600 ring-gray-200'
                          }`}
                        >
                          {o.user_id ? 'Registriran kupec' : 'Gost'}
                        </span>
                      </span>
                      <span className="block text-xs text-navy-800/50">{o.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mb-1 block text-xs text-navy-800/60">{PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}</span>
                      <PaymentStatusBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-navy-900">
                      <Link to={`/admin/narocila/${o.id}`}>{formatEur(Number(o.total))}</Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-navy-800/50">
                      Ni naročil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm text-navy-800/70">
              <span>
                Stran {page + 1} od {pages}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => update({ stran: String(page - 1) })} className="admin-btn-secondary px-2.5 py-1.5" aria-label="Prejšnja stran">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" disabled={page >= pages - 1} onClick={() => update({ stran: String(page + 1) })} className="admin-btn-secondary px-2.5 py-1.5" aria-label="Naslednja stran">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
