import { FileText, Download, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { callFunction } from '@/lib/supabase';
import { formatDateTime, formatEur, PAYMENT_METHOD_LABELS, type Order } from '@/data/orders';

interface InvoiceInfo {
  invoice_number: string;
  invoice_issued_at: string;
}

interface StoreInfo {
  store_email: string;
  bank_details: { recipient: string; iban: string; bic: string; bank: string; purpose: string };
}

async function loadStoreInfo(): Promise<StoreInfo> {
  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase.from('store_settings').select('store_email, bank_details').eq('id', true).maybeSingle();
  return {
    store_email: data?.store_email ?? 'info@manukamed.si',
    bank_details: data?.bank_details ?? { recipient: '', iban: '', bic: '', bank: '', purpose: 'Plačilo naročila' },
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function InvoiceDocument({ order, invoice, store }: { order: Order; invoice: InvoiceInfo; store: StoreInfo }) {
  const items = order.order_items ?? [];
  return (
    <div id="invoice-print-area" className="mx-auto max-w-[800px] bg-white p-12 text-sm text-navy-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-navy-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAČUN</h1>
          <p className="mt-2 text-lg font-medium">{invoice.invoice_number}</p>
          <p className="mt-1 text-xs text-navy-800/60">Datum izdaje: {formatDate(invoice.invoice_issued_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-navy-900">ManukaMed</p>
          <p className="text-xs text-navy-800/70">{store.store_email}</p>
          <p className="mt-2 text-xs text-navy-800/60">Spletna trgovina</p>
          <p className="text-xs text-navy-800/60">manukamed.si</p>
        </div>
      </div>

      {/* Customer + details */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-navy-800/50">Kupec</p>
          <p className="font-medium">{order.first_name} {order.last_name}</p>
          <p className="text-xs text-navy-800/70">{order.email}</p>
          {order.phone && <p className="text-xs text-navy-800/70">{order.phone}</p>}
          <address className="mt-1 text-xs not-italic leading-relaxed text-navy-800/70">
            {order.address}
            {order.address2 && <><br />{order.address2}</>}
            <br />{order.postal_code} {order.city}
            <br />{order.country}
          </address>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-navy-800/50">Podatki o naročilu</p>
          <table className="text-xs">
            <tbody>
              <tr><td className="pr-4 text-navy-800/60">Številka naročila:</td><td className="font-medium">{order.order_number}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Datum naročila:</td><td>{formatDate(order.created_at)}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Način plačila:</td><td>{PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Status plačila:</td><td>{order.payment_status === 'paid' ? 'Plačano' : 'Neplačano'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items table */}
      <table className="mt-8 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-navy-200 bg-navy-50 text-left">
            <th className="px-3 py-2 font-medium text-navy-800/70">#</th>
            <th className="px-3 py-2 font-medium text-navy-800/70">Izdelek</th>
            <th className="px-3 py-2 text-right font-medium text-navy-800/70">Količina</th>
            <th className="px-3 py-2 text-right font-medium text-navy-800/70">Cena/kos</th>
            <th className="px-3 py-2 text-right font-medium text-navy-800/70">Skupaj</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className="border-b border-navy-50">
              <td className="px-3 py-2.5 text-navy-800/50">{i + 1}</td>
              <td className="px-3 py-2.5">
                <span className="font-medium">{item.name}</span>
                <span className="block text-navy-800/50">{item.size}{item.subscribe && ' · naročnina'}</span>
              </td>
              <td className="px-3 py-2.5 text-right">{item.qty}</td>
              <td className="px-3 py-2.5 text-right">{formatEur(Number(item.unit_price))}</td>
              <td className="px-3 py-2.5 text-right font-medium">{formatEur(Number(item.total))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-1.5 text-xs">
          <div className="flex justify-between text-navy-800/70"><span>Vmesni seštevek</span><span>{formatEur(Number(order.subtotal))}</span></div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-700"><span>Popust{order.discount_code && ` (${order.discount_code})`}</span><span>-{formatEur(Number(order.discount))}</span></div>
          )}
          <div className="flex justify-between text-navy-800/70"><span>Dostava ({order.shipping_label})</span><span>{Number(order.shipping_cost) === 0 ? 'Brezplačno' : formatEur(Number(order.shipping_cost))}</span></div>
          {Number(order.payment_fee) > 0 && (
            <div className="flex justify-between text-navy-800/70"><span>Strošek plačila</span><span>{formatEur(Number(order.payment_fee))}</span></div>
          )}
          <div className="flex justify-between border-t-2 border-navy-900 pt-2 text-base font-bold text-navy-900"><span>Skupaj za plačilo</span><span>{formatEur(Number(order.total))}</span></div>
        </div>
      </div>

      {/* Bank details for bank transfer */}
      {order.payment_method === 'bank' && (
        <div className="mt-8 rounded-lg border border-navy-100 bg-navy-50/50 p-4 text-xs">
          <p className="mb-2 font-medium uppercase tracking-wider text-navy-800/50">Podatki za nakazilo</p>
          <table>
            <tbody>
              <tr><td className="pr-4 text-navy-800/60">Prejemnik:</td><td className="font-medium">{store.bank_details.recipient || 'ManukaMed'}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">IBAN:</td><td className="font-medium">{store.bank_details.iban}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">BIC/SWIFT:</td><td className="font-medium">{store.bank_details.bic}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Banka:</td><td>{store.bank_details.bank}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Sklic:</td><td className="font-medium">{order.order_number}</td></tr>
              <tr><td className="pr-4 text-navy-800/60">Namen:</td><td>{store.bank_details.purpose}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-navy-100 pt-4 text-center text-xs text-navy-800/40">
        <p>Račun je izdan elektronsko in je veljaven brez podpisa in žiga.</p>
        <p className="mt-1">ManukaMed · {store.store_email} · manukamed.si</p>
      </div>
    </div>
  );
}

export function useInvoice() {
  const { session } = useAdminAuth();
  const [invoice, setInvoice] = useState<InvoiceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<StoreInfo | null>(null);

  useEffect(() => {
    loadStoreInfo().then(setStore);
  }, []);

  const generate = async (orderId: string): Promise<InvoiceInfo | null> => {
    setLoading(true);
    try {
      const res = await callFunction<{ invoice: InvoiceInfo }>('admin-manage', { action: 'generate_invoice', order_id: orderId }, session?.access_token);
      setInvoice(res.invoice);
      return res.invoice;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadExisting = (invoiceNumber: string | null, invoiceIssuedAt: string | null) => {
    if (invoiceNumber && invoiceIssuedAt) {
      setInvoice({ invoice_number: invoiceNumber, invoice_issued_at: invoiceIssuedAt });
    }
  };

  return { invoice, loading, generate, loadExisting, store };
}

export function InvoiceButtons({ order, onGenerate, invoice, loading }: { order: Order; onGenerate: () => void; invoice: InvoiceInfo | null; loading: boolean }) {
  const printRef = useRef<Window | null>(null);

  const handlePrint = () => {
    const area = document.getElementById('invoice-print-area');
    if (!area) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    printRef.current = win;
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Račun ${invoice?.invoice_number ?? order.order_number}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; padding: 48px; color: #1a2238; }
        table { border-collapse: collapse; width: 100%; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>${area.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const hasInvoice = Boolean(invoice);

  return (
    <div className="flex flex-wrap gap-2">
      {!hasInvoice ? (
        <button type="button" onClick={onGenerate} disabled={loading} className="admin-btn">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Izdaj račun
        </button>
      ) : (
        <>
          <button type="button" onClick={handlePrint} className="admin-btn">
            <Download className="h-4 w-4" /> Prenesi PDF
          </button>
          <button type="button" onClick={handlePrint} className="admin-btn-secondary">
            <FileText className="h-4 w-4" /> Odpri račun
          </button>
        </>
      )}
    </div>
  );
}
