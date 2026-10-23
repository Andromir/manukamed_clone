import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import SalesChart from '@/components/admin/SalesChart';
import { Card, Field, LoadingBlock, Notice, PageHeader, Spinner } from '@/components/admin/ui';
import { useStore } from '@/context/StoreContext';
import { formatEur, PAYMENT_METHOD_LABELS } from '@/data/orders';
import { GA_ID_PATTERN } from '@/lib/analytics';
import { dailySeries, loadStatsOrders, paymentBreakdown, summarize, topProducts, type StatsOrder } from '@/lib/salesStats';
import { supabase } from '@/lib/supabase';

const ranges = [7, 30, 90];

function GoogleAnalyticsCard() {
  const { settings, reload } = useStore();
  const [gaId, setGaId] = useState(settings.ga_measurement_id);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setGaId(settings.ga_measurement_id), [settings.ga_measurement_id]);

  const save = async () => {
    const value = gaId.trim().toUpperCase();
    if (value && !GA_ID_PATTERN.test(value)) return setResult({ ok: false, text: 'ID mora biti v obliki G-XXXXXXXXXX.' });
    setSaving(true);
    const { error } = await supabase.from('store_settings').update({ ga_measurement_id: value }).eq('id', true);
    setSaving(false);
    if (error) return setResult({ ok: false, text: 'Shranjevanje ni uspelo.' });
    await reload();
    setResult({ ok: true, text: value ? 'Google Analytics je povezan. Obiski se beležijo pri obiskovalcih, ki sprejmejo piškotke.' : 'Google Analytics je odklopljen.' });
  };

  const connected = Boolean(settings.ga_measurement_id);

  return (
    <Card
      title="Google Analytics 4"
      description="Spremljajte obiske, vire prometa in nakupe. Kupcem se prikaže obvestilo o piškotkih, analitika pa se vklopi šele po njihovem soglasju."
      actions={
        connected && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Povezano
          </span>
        )
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Field label="ID meritve (Measurement ID)" hint="Pustite prazno za odklop.">
            <input value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" className="admin-input font-mono" />
          </Field>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving || gaId.trim().toUpperCase() === settings.ga_measurement_id} className="admin-btn">
              {saving && <Spinner />} Shrani
            </button>
            {connected && (
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="admin-btn-secondary">
                <ExternalLink className="h-4 w-4" /> Odpri Google Analytics
              </a>
            )}
          </div>
          {result && (
            <div className="mt-4">
              <Notice tone={result.ok ? 'success' : 'error'}>{result.text}</Notice>
            </div>
          )}
        </div>
        <ol className="space-y-2 rounded-lg bg-ink-50/60 p-4 text-sm text-ink-800">
          <li>1. Prijavite se na analytics.google.com z Google računom.</li>
          <li>2. Ustvarite lastnost (Property) za brandspot.si.</li>
          <li>3. Dodajte spletni podatkovni tok (Web) z naslovom vaše strani.</li>
          <li>4. Kopirajte ID meritve, ki se začne z G-, in ga prilepite sem.</li>
        </ol>
      </div>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [orders, setOrders] = useState<StatsOrder[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrders(null);
    loadStatsOrders(days)
      .then(setOrders)
      .catch((err: Error) => setError(err.message));
  }, [days]);

  const summary = orders ? summarize(orders) : null;
  const top = orders ? topProducts(orders) : [];
  const payments = orders ? paymentBreakdown(orders) : [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Analitika"
        description="Prodaja iz vaše trgovine in povezava z Google Analytics."
        actions={
          <div className="flex rounded-lg border border-ink-100 bg-white p-1">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${days === r ? 'bg-ink-900 text-white' : 'text-ink-800/70 hover:bg-ink-50'}`}
              >
                {r} dni
              </button>
            ))}
          </div>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      {!orders || !summary ? (
        !error && <LoadingBlock />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Prihodki', formatEur(summary.revenue)],
              ['Naročila', String(summary.orders)],
              ['Povprečna košarica', formatEur(summary.average)],
              ['Preklicana', String(summary.cancelled)],
            ].map(([label, value]) => (
              <div key={label} className="admin-card">
                <p className="text-sm text-ink-800/60">{label}</p>
                <p className="mt-2 text-2xl font-medium tracking-tight text-ink-900">{value}</p>
              </div>
            ))}
          </div>

          <Card title="Prihodki po dnevih">
            <SalesChart data={dailySeries(orders, days)} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Najbolje prodajani izdelki">
              {top.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-800/50">V tem obdobju ni prodaje.</p>
              ) : (
                <ul className="space-y-3">
                  {top.map((p) => (
                    <li key={p.slug}>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="truncate text-ink-900">{p.name}</span>
                        <span className="shrink-0 font-medium text-ink-900">{formatEur(p.revenue)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-50">
                          <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${(p.revenue / top[0].revenue) * 100}%` }} />
                        </div>
                        <span className="w-14 text-right text-xs text-ink-800/50">{p.qty} kos</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Plačilne metode">
              {payments.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-800/50">V tem obdobju ni prodaje.</p>
              ) : (
                <ul className="divide-y divide-ink-50">
                  {payments.map((p) => (
                    <li key={p.method} className="flex items-center justify-between py-3 text-sm">
                      <span className="text-ink-900">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</span>
                      <span className="text-ink-800/60">
                        {p.orders} naročil · <span className="font-medium text-ink-900">{formatEur(p.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      <GoogleAnalyticsCard />
    </div>
  );
}
