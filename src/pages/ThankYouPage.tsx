import { AlertCircle, CheckCircle2, Clock, Landmark, Mail, Package, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import PageLoader from '@/components/ui/PageLoader';
import { useCart } from '@/context/CartContext';
import type { BankDetails, PaymentMethodId } from '@/data/settings';
import { trackEvent } from '@/lib/analytics';
import { formatPrice } from '@/lib/format';
import { callFunction } from '@/lib/supabase';

interface OrderStatus {
  order_number: string;
  email: string;
  total: number;
  status: string;
  payment_method: PaymentMethodId;
  payment_status: string;
  bank_details: BankDetails | null;
}

function BankTransferBox({ order }: { order: OrderStatus }) {
  const bank = order.bank_details;
  const rows = [
    ['Prejemnik', bank?.recipient],
    ['IBAN', bank?.iban],
    ['BIC', bank?.bic],
    ['Banka', bank?.bank],
    ['Znesek', formatPrice(order.total)],
    ['Sklic', order.order_number],
    ['Namen', bank?.purpose],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <div className="mx-auto mt-12 max-w-xl border border-brand-300 bg-mist-50 p-8">
      <div className="flex items-center gap-3">
        <Landmark className="h-5 w-5 text-brand-700" strokeWidth={1.5} />
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-ink-900">Podatki za plačilo (UPN)</h2>
      </div>
      <dl className="mt-6 divide-y divide-ink-100 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 py-2.5">
            <dt className="text-ink-800/60">{label}</dt>
            <dd className="select-all text-right font-medium text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-ink-800/60">Naročilo odpošljemo, ko prejmemo plačilo. Pri plačilu obvezno navedite sklic.</p>
    </div>
  );
}

export default function ThankYouPage() {
  const [params] = useSearchParams();
  const { clear } = useCart();
  const orderNumber = params.get('o') ?? '';
  const token = params.get('t') ?? '';
  const sessionId = params.get('session_id') ?? undefined;
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderNumber || !token) return;
    let active = true;
    callFunction<OrderStatus>('order-status', { order_number: orderNumber, token, session_id: sessionId })
      .then((res) => {
        if (!active) return;
        if (typeof res.order_number !== 'string') throw new Error('Naročila ni bilo mogoče najti.');
        setOrder(res);
        if (res.status !== 'pending_payment' && res.status !== 'cancelled') {
          clear();
          const trackedKey = `mm-tracked-${res.order_number}`;
          if (!sessionStorage.getItem(trackedKey)) {
            sessionStorage.setItem(trackedKey, '1');
            trackEvent('purchase', { transaction_id: res.order_number, value: Number(res.total), currency: 'EUR' });
          }
        }
      })
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : 'Naročila ni bilo mogoče najti.'));
    return () => {
      active = false;
    };
  }, [orderNumber, token, sessionId, clear]);

  if (!orderNumber || !token) return <Navigate to="/" replace />;
  if (error) {
    return (
      <section className="container-x py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600" strokeWidth={1.25} />
        <h1 className="heading-md mt-6">Naročila ni bilo mogoče prikazati</h1>
        <p className="mt-3 text-sm text-ink-800/70">{error}</p>
        <Link to="/kontakt" className="btn-outline mt-8">
          Kontaktirajte nas
        </Link>
      </section>
    );
  }
  if (!order) return <PageLoader label="Preverjanje naročila …" />;

  const awaitingPayment = order.status === 'pending_payment' || order.status === 'cancelled';
  if (awaitingPayment) {
    return (
      <section className="container-x py-24 text-center">
        <Clock className="mx-auto h-12 w-12 text-brand-600" strokeWidth={1.25} />
        <p className="eyebrow mt-8">Naročilo {order.order_number}</p>
        <h1 className="heading-md mt-4">Plačilo ni bilo zaključeno</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-800/70">
          Plačila nismo prejeli. Izdelki so še vedno v vaši košarici – poskusite znova ali izberite drug način plačila.
        </p>
        <Link to="/blagajna" className="btn-primary mt-8">
          Nazaj na blagajno
        </Link>
      </section>
    );
  }

  const isBank = order.payment_method === 'bank';
  const steps = [
    { Icon: Mail, title: 'Naročilo prejeto', text: `O odpremi vas obvestimo na ${order.email}.` },
    { Icon: Package, title: 'Pripravimo paket', text: isBank ? 'Paket pripravimo takoj po prejemu plačila.' : 'Naročila do 12. ure odpošljemo isti dan.' },
    { Icon: Truck, title: 'Dostava', text: 'Paket običajno prejmete v 1–3 delovnih dneh.' },
  ];

  return (
    <section className="container-x py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 animate-scale-in text-emerald-600" strokeWidth={1.25} />
        <p className="eyebrow mt-8">Naročilo {order.order_number}</p>
        <h1 className="heading-lg mt-4">Hvala za vaše naročilo!</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-800/70">
          Vaše naročilo v vrednosti <strong className="font-medium text-ink-900">{formatPrice(order.total)}</strong> smo prejeli
          {order.payment_status === 'paid' ? ' in plačilo je potrjeno.' : '.'}
        </p>
      </div>
      {isBank && <BankTransferBox order={order} />}
      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        {steps.map(({ Icon, title, text }) => (
          <div key={title} className="border border-ink-100 p-8 text-center">
            <Icon className="mx-auto h-7 w-7 text-brand-600" strokeWidth={1.25} />
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.14em] text-ink-900">{title}</p>
            <p className="mt-2 text-sm text-ink-800/70">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-14 text-center">
        <Link to="/trgovina" className="btn-primary">
          Nadaljuj z nakupovanjem
        </Link>
      </div>
    </section>
  );
}
