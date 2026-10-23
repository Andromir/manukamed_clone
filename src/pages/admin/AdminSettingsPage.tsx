import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DiscountCodes from '@/components/admin/settings/DiscountCodes';
import PaymentSettings from '@/components/admin/settings/PaymentSettings';
import ShippingSettings from '@/components/admin/settings/ShippingSettings';
import { Card, Field, LoadingBlock, Notice, PageHeader, SaveBar } from '@/components/admin/ui';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useStore } from '@/context/StoreContext';
import { normalizeSettings, type StoreSettings } from '@/data/settings';
import { supabase } from '@/lib/supabase';

const tabs = [
  { id: 'placila', label: 'Plačila' },
  { id: 'dostava', label: 'Dostava' },
  { id: 'popusti', label: 'Kode za popust' },
  { id: 'splosno', label: 'Splošno' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function AdminSettingsPage() {
  const { session } = useAdminAuth();
  const { reload } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (tabs.find((t) => t.id === params.get('zavihek'))?.id ?? 'placila') as TabId;
  const [saved, setSaved] = useState<StoreSettings | null>(null);
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) return setError('Nastavitev ni bilo mogoče naložiti.');
        const s = normalizeSettings(data);
        setSaved(s);
        setDraft(s);
      });
  }, []);

  if (!draft || !saved || !session) return error ? <Notice tone="error">{error}</Notice> : <LoadingBlock />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (p: Partial<StoreSettings>) => {
    setMessage('');
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  const save = async () => {
    if (!draft.shipping_methods.some((m) => m.enabled)) return setError('Vključen mora biti vsaj en način dostave.');
    if (!Object.values(draft.payment_methods).some((m) => m.enabled)) return setError('Vključena mora biti vsaj ena plačilna metoda.');
    if (draft.shipping_methods.some((m) => !m.label.trim())) return setError('Vsak način dostave potrebuje naziv.');
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('store_settings')
      .update({
        free_shipping_threshold: draft.free_shipping_threshold,
        subscribe_discount: draft.subscribe_discount,
        shipping_methods: draft.shipping_methods,
        payment_methods: draft.payment_methods,
        bank_details: draft.bank_details,
        countries: draft.countries,
        store_email: draft.store_email.trim(),
      })
      .eq('id', true);
    setSaving(false);
    if (err) return setError('Shranjevanje ni uspelo. Poskusite znova.');
    setSaved(draft);
    setMessage('Nastavitve so shranjene.');
    reload();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Nastavitve trgovine" description="Plačila, dostava, kode za popust in splošni podatki." />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams({ zavihek: t.id }, { replace: true })}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-800/60 hover:text-ink-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && tab !== 'popusti' && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {tab === 'placila' && <PaymentSettings value={draft} onChange={patch} accessToken={session.access_token} />}
      {tab === 'dostava' && <ShippingSettings value={draft} onChange={patch} />}
      {tab === 'popusti' && <DiscountCodes />}
      {tab === 'splosno' && (
        <Card title="Splošni podatki">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-pošta trgovine" hint="Za obvestila in stik s kupci.">
              <input type="email" value={draft.store_email} onChange={(e) => patch({ store_email: e.target.value })} className="admin-input" />
            </Field>
            <Field label="Države dostave" hint="Ločite z vejico, npr. Slovenija, Hrvaška.">
              <input
                value={draft.countries.join(', ')}
                onChange={(e) =>
                  patch({
                    countries: e.target.value
                      .split(',')
                      .map((c) => c.trimStart())
                      .filter((c, i, all) => c || i === all.length - 1),
                  })
                }
                onBlur={() => patch({ countries: draft.countries.map((c) => c.trim()).filter(Boolean) })}
                className="admin-input"
              />
            </Field>
          </div>
        </Card>
      )}

      {tab !== 'popusti' && (
        <SaveBar
          dirty={dirty}
          saving={saving}
          onSave={save}
          onReset={() => {
            setDraft(saved);
            setError('');
          }}
          message={!dirty && message ? <span className="text-emerald-700">{message}</span> : undefined}
        />
      )}
    </div>
  );
}
