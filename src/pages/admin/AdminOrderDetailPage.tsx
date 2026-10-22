import { ArrowLeft, Mail, Phone, Printer, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/StatusBadge';
import { Card, Field, LoadingBlock, Notice, Spinner } from '@/components/admin/ui';
import { InvoiceButtons, InvoiceDocument, useInvoice } from '@/components/admin/InvoiceDocument';
import { formatDateTime, formatEur, ORDER_STATUSES, PAYMENT_METHOD_LABELS, PAYMENT_STATUSES, type Order } from '@/data/orders';
import { supabase } from '@/lib/supabase';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { invoice, loading: invLoading, generate, loadExisting, store } = useInvoice();
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) return setError('Naročila ni bilo mogoče najti.');
        const o = data as Order;
        setOrder(o);
        setStatus(o.status);
        setPayment(o.payment_status);
        setNote(o.admin_note ?? '');
        loadExisting((o as Order & { invoice_number?: string }).invoice_number ?? null, (o as Order & { invoice_issued_at?: string }).invoice_issued_at ?? null);
      });
  }, [id]);

  if (!order) return error ? <Notice tone="error">{error}</Notice> : <LoadingBlock />;

  const dirty = status !== order.status || payment !== order.payment_status || note !== (order.admin_note ?? '');

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const { data, error: err } = await supabase
      .from('orders')
      .update({ status, payment_status: payment, admin_note: note.trim() || null })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .maybeSingle();
    setSaving(false);
    if (err || !data) return setError('Sprememb ni bilo mogoče shraniti.');
    setOrder(data as Order);
    setMessage(status === 'cancelled' && order.status !== 'cancelled' ? 'Naročilo je preklicano, zaloga izdelkov je vrnjena.' : 'Spremembe so shranjene.');
  };

  const handleGenerate = async () => {
    const inv = await generate(order.id);
    if (inv) {
      setShowInvoice(true);
      const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', order.id).maybeSingle();
      if (data) setOrder(data as Order);
    }
  };

  const items = order.order_items ?? [];

  return (
    <div className="animate-fade-in">
      <Link to="/admin/narocila" className="mb-4 inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-900 print:hidden">
        <ArrowLeft className="h-4 w-4" /> Vsa naročila
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-navy-900">Naročilo {order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <p className="mt-1 text-sm text-navy-800/60">{formatDateTime(order.created_at)}</p>
          {invoice && <p className="mt-1 text-xs text-gold-700">Račun: {invoice.invoice_number} · {new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(invoice.invoice_issued_at))}</p>}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <InvoiceButtons order={order} onGenerate={handleGenerate} invoice={invoice} loading={invLoading} />
          {invoice && (
            <button type="button" onClick={() => setShowInvoice((v) => !v)} className="admin-btn-secondary">
              <Printer className="h-4 w-4" /> {showInvoice ? 'Skrij račun' : 'Prikaži račun'}
            </button>
          )}
          <button type="button" onClick={() => window.print()} className="admin-btn-secondary">
            <Printer className="h-4 w-4" /> Natisni
          </button>
        </div>
      </div>

      {showInvoice && invoice && store && (
        <div className="mb-8 rounded-xl border border-navy-100 bg-white print:block">
          <InvoiceDocument order={order} invoice={invoice} store={store} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 print:hidden">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Izdelki">
            <ul className="divide-y divide-navy-50">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                    {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-900">{item.name}</p>
                    <p className="text-xs text-navy-800/60">
                      {item.size}
                      {item.subscribe && ' · naročnina'} · {item.qty} × {formatEur(Number(item.unit_price))}
                    </p>
                  </div>
                  <span className="font-medium text-navy-900">{formatEur(Number(item.total))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-navy-100 pt-4 text-sm">
              <div className="flex justify-between text-navy-800/70">
                <dt>Vmesni seštevek</dt>
                <dd>{formatEur(Number(order.subtotal))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Popust {order.discount_code && `(${order.discount_code})`}</dt>
                  <dd>-{formatEur(Number(order.discount))}</dd>
                </div>
              )}
              <div className="flex justify-between text-navy-800/70">
                <dt>Dostava ({order.shipping_label})</dt>
                <dd>{Number(order.shipping_cost) === 0 ? 'Brezplačno' : formatEur(Number(order.shipping_cost))}</dd>
              </div>
              {Number(order.payment_fee) > 0 && (
                <div className="flex justify-between text-navy-800/70">
                  <dt>Strošek plačila</dt>
                  <dd>{formatEur(Number(order.payment_fee))}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-medium text-navy-900">
                <dt>Skupaj</dt>
                <dd>{formatEur(Number(order.total))}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Upravljanje" description="Ob preklicu se zaloga izdelkov samodejno vrne.">
            <div className="print:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status naročila">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status plačila">
                  <select value={payment} onChange={(e) => setPayment(e.target.value)} className="admin-input">
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Interna opomba" hint="Vidna samo skrbnikom." className="sm:col-span-2">
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="admin-input" />
                </Field>
              </div>
              {status === 'cancelled' && order.status !== 'cancelled' && (
                <div className="mt-4">
                  <Notice tone="info">Ob shranjevanju bo naročilo preklicano in izdelki vrnjeni na zalogo.</Notice>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={save} disabled={!dirty || saving} className="admin-btn">
                  {saving && <Spinner />} Shrani spremembe
                </button>
                {message && <span className="text-sm text-emerald-700">{message}</span>}
                {error && <span className="text-sm text-red-600">{error}</span>}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Kupec">
            <p className="font-medium text-navy-900">
              {order.first_name} {order.last_name}
            </p>
            {order.user_id ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <UserCheck className="h-3.5 w-3.5" /> Registriran kupec – povezano z računom
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                <UserX className="h-3.5 w-3.5" /> Gost – brez računa
              </p>
            )}
            <div className="mt-3 space-y-2 text-sm">
              <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-navy-700 hover:text-navy-900">
                <Mail className="h-4 w-4" /> {order.email}
              </a>
              {order.phone && (
                <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-navy-700 hover:text-navy-900">
                  <Phone className="h-4 w-4" /> {order.phone}
                </a>
              )}
            </div>
            {order.newsletter && <p className="mt-3 text-xs text-navy-800/50">Prijavljen na e-novice.</p>}
          </Card>

          <Card title="Naslov za dostavo">
            <address className="text-sm not-italic leading-relaxed text-navy-800">
              {order.address}
              {order.address2 && (
                <>
                  <br />
                  {order.address2}
                </>
              )}
              <br />
              {order.postal_code} {order.city}
              <br />
              {order.country}
            </address>
          </Card>

          <Card title="Plačilo">
            <p className="text-sm text-navy-900">{PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}</p>
            {order.payment_ref && <p className="mt-1 break-all text-xs text-navy-800/50">Ref: {order.payment_ref}</p>}
            {order.payment_method === 'bank' && <p className="mt-2 text-xs text-navy-800/60">Sklic za nakazilo: {order.order_number}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
