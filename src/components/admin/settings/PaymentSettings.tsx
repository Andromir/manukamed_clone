import { Banknote, CreditCard, KeyRound, Landmark, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, Field, Notice, Spinner, Toggle } from '@/components/admin/ui';
import { PAYMENT_METHOD_IDS, type PaymentMethod, type PaymentMethodId, type StoreSettings } from '@/data/settings';
import { callFunction } from '@/lib/supabase';

type Provider = 'stripe' | 'paypal';

interface ProviderStatus {
  configured: boolean;
  mode: 'test' | 'live';
  public_key: string;
  secret_masked: string;
  verified_at: string | null;
}

const icons: Record<PaymentMethodId, LucideIcon> = { cod: Banknote, bank: Landmark, stripe: CreditCard, paypal: Wallet };

const providerHelp: Record<Provider, { publicLabel: string; secretLabel: string; help: string; url: string }> = {
  stripe: {
    publicLabel: 'Objavljivi ključ (pk_...)',
    secretLabel: 'Skrivni ključ (sk_...)',
    help: 'Ključe najdete v nadzorni plošči Stripe pod Developers, API keys.',
    url: 'https://dashboard.stripe.com/apikeys',
  },
  paypal: {
    publicLabel: 'Client ID',
    secretLabel: 'Secret',
    help: 'Ustvarite aplikacijo v PayPal Developer pod Apps & Credentials.',
    url: 'https://developer.paypal.com/dashboard/applications',
  },
};

function ProviderCredentials({
  provider,
  status,
  accessToken,
  onStatus,
  onFailed,
}: {
  provider: Provider;
  status: ProviderStatus;
  accessToken: string;
  onStatus: () => Promise<void>;
  onFailed: () => void;
}) {
  const help = providerHelp[provider];
  const [mode, setMode] = useState(status.mode);
  const [publicKey, setPublicKey] = useState(status.public_key);
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: 'save' | 'test') => {
    setBusy(action);
    setResult(null);
    try {
      const body = action === 'save' ? { action, provider, mode, public_key: publicKey.trim(), secret_key: secret.trim() } : { action, provider };
      await callFunction<{ ok: boolean }>('admin-payments', body, accessToken);
      setSecret('');
      setResult({ ok: true, text: 'Povezava deluje. Plačilno metodo lahko zdaj vključite.' });
    } catch (err) {
      onFailed();
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Preverjanje ni uspelo.' });
    } finally {
      await onStatus();
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <KeyRound className="h-4 w-4 text-brand-600" /> Podatki za povezavo
        </p>
        {status.verified_at ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Preverjeno ({status.mode === 'live' ? 'živo' : 'testno'})
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">Ni povezano</span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Način">
          <select value={mode} onChange={(e) => setMode(e.target.value as 'test' | 'live')} className="admin-input">
            <option value="test">Testni (za preizkus)</option>
            <option value="live">Živi (prava plačila)</option>
          </select>
        </Field>
        <Field label={help.publicLabel}>
          <input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} autoComplete="off" className="admin-input font-mono text-xs" />
        </Field>
        <Field label={help.secretLabel} hint={status.configured ? `Shranjen: ${status.secret_masked}. Pustite prazno, da ostane nespremenjen.` : undefined} className="sm:col-span-2">
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="new-password" className="admin-input font-mono text-xs" />
        </Field>
      </div>
      <p className="mt-3 text-xs text-ink-800/60">
        {help.help}{' '}
        <a href={help.url} target="_blank" rel="noreferrer" className="underline hover:text-ink-900">
          Odpri
        </a>
      </p>
      {result && (
        <div className="mt-4">
          <Notice tone={result.ok ? 'success' : 'error'}>{result.text}</Notice>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => run('save')} disabled={busy !== null || (!secret.trim() && !status.configured)} className="admin-btn">
          {busy === 'save' && <Spinner />} Shrani in preveri
        </button>
        {status.configured && (
          <button type="button" onClick={() => run('test')} disabled={busy !== null} className="admin-btn-secondary">
            {busy === 'test' && <Spinner />} Ponovno preveri
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  value: StoreSettings;
  onChange: (patch: Partial<StoreSettings>) => void;
  accessToken: string;
}

export default function PaymentSettings({ value, onChange, accessToken }: Props) {
  const [status, setStatus] = useState<Record<Provider, ProviderStatus> | null>(null);
  const [statusError, setStatusError] = useState('');

  const loadStatus = async () => {
    try {
      setStatus(await callFunction<Record<Provider, ProviderStatus>>('admin-payments', { action: 'status' }, accessToken));
      setStatusError('');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Stanja plačilnih ponudnikov ni bilo mogoče naložiti.');
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const setMethod = (id: PaymentMethodId, patch: Partial<PaymentMethod>) =>
    onChange({ payment_methods: { ...value.payment_methods, [id]: { ...value.payment_methods[id], ...patch } } });
  const bank = value.bank_details;
  const setBank = (patch: Partial<typeof bank>) => onChange({ bank_details: { ...bank, ...patch } });

  return (
    <div className="space-y-6">
      {statusError && <Notice tone="error">{statusError}</Notice>}
      {PAYMENT_METHOD_IDS.map((id) => {
        const m = value.payment_methods[id];
        const Icon = icons[id];
        const isProvider = id === 'stripe' || id === 'paypal';
        const providerStatus = isProvider ? status?.[id] : undefined;
        const canEnable = !isProvider || Boolean(providerStatus?.verified_at);
        return (
          <Card key={id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.enabled ? 'bg-ink-900 text-brand-300' : 'bg-ink-50 text-ink-400'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-ink-900">{m.label}</p>
                  <p className="text-xs text-ink-800/60">
                    {m.enabled ? 'Na voljo kupcem na blagajni' : canEnable ? 'Izklopljeno' : 'Za vklop najprej vnesite in preverite podatke za povezavo'}
                  </p>
                </div>
              </div>
              <Toggle checked={m.enabled} disabled={!m.enabled && !canEnable} onChange={(v) => setMethod(id, { enabled: v })} label={`Vključi ${m.label}`} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label="Naziv na blagajni" className="sm:col-span-2">
                <input value={m.label} onChange={(e) => setMethod(id, { label: e.target.value })} className="admin-input" />
              </Field>
              <Field label="Dodatni strošek (EUR)">
                <input type="number" min="0" step="0.01" value={m.fee} onChange={(e) => setMethod(id, { fee: Math.max(0, Number(e.target.value) || 0) })} className="admin-input" />
              </Field>
              <Field label="Opis za kupca" className="sm:col-span-3">
                <input value={m.description} onChange={(e) => setMethod(id, { description: e.target.value })} className="admin-input" />
              </Field>
            </div>

            {isProvider &&
              (providerStatus ? (
                <ProviderCredentials
                  provider={id}
                  status={providerStatus}
                  accessToken={accessToken}
                  onStatus={loadStatus}
                  onFailed={() => setMethod(id, { enabled: false })}
                />
              ) : (
                !statusError && (
                  <div className="mt-4 flex justify-center py-4 text-ink-300">
                    <Spinner />
                  </div>
                )
              ))}

            {id === 'bank' && (
              <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/40 p-4">
                <p className="mb-4 text-sm font-medium text-ink-900">Podatki za nakazilo (prikazani kupcu po naročilu)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prejemnik">
                    <input value={bank.recipient} onChange={(e) => setBank({ recipient: e.target.value })} className="admin-input" />
                  </Field>
                  <Field label="Banka">
                    <input value={bank.bank} onChange={(e) => setBank({ bank: e.target.value })} className="admin-input" />
                  </Field>
                  <Field label="IBAN">
                    <input value={bank.iban} onChange={(e) => setBank({ iban: e.target.value.toUpperCase() })} className="admin-input font-mono" />
                  </Field>
                  <Field label="BIC / SWIFT">
                    <input value={bank.bic} onChange={(e) => setBank({ bic: e.target.value.toUpperCase() })} className="admin-input font-mono" />
                  </Field>
                  <Field label="Namen plačila" className="sm:col-span-2">
                    <input value={bank.purpose} onChange={(e) => setBank({ purpose: e.target.value })} className="admin-input" />
                  </Field>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
