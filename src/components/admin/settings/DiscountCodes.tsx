import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Card, Field, LoadingBlock, Notice, Spinner, Toggle } from '@/components/admin/ui';
import { supabase } from '@/lib/supabase';

interface DiscountCode {
  code: string;
  percent: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
}

const formatDate = (iso: string) => new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(iso));

export default function DiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[] | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [expires, setExpires] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error: err } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    if (err) setError('Kod ni bilo mogoče naložiti.');
    else setCodes(data as DiscountCode[]);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const pct = Number(percent);
    if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) return setError('Koda naj ima 3 do 30 znakov (črke, številke, vezaj).');
    if (!(pct > 0 && pct <= 90)) return setError('Popust mora biti med 1 in 90 %.');
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('discount_codes').insert({
      code: clean,
      percent: pct,
      active: true,
      expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
      max_uses: maxUses ? Math.max(1, Number(maxUses)) : null,
    });
    setBusy(false);
    if (err) return setError(err.code === '23505' ? 'Ta koda že obstaja.' : 'Kode ni bilo mogoče dodati.');
    setCode('');
    setExpires('');
    setMaxUses('');
    load();
  };

  const toggle = async (c: DiscountCode) => {
    setCodes((list) => list?.map((x) => (x.code === c.code ? { ...x, active: !c.active } : x)) ?? null);
    const { error: err } = await supabase.from('discount_codes').update({ active: !c.active }).eq('code', c.code);
    if (err) {
      setError('Sprememba ni bila shranjena.');
      load();
    }
  };

  const remove = async (c: DiscountCode) => {
    if (!window.confirm(`Izbrišem kodo ${c.code}?`)) return;
    const { error: err } = await supabase.from('discount_codes').delete().eq('code', c.code);
    if (err) setError('Kode ni bilo mogoče izbrisati.');
    load();
  };

  return (
    <div className="space-y-6">
      <Card title="Nova koda za popust" description="Spremembe kod se shranijo takoj.">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-5 sm:items-end">
          <Field label="Koda" className="sm:col-span-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="npr. POLETJE15" className="admin-input font-mono uppercase" />
          </Field>
          <Field label="Popust (%)">
            <input type="number" min="1" max="90" value={percent} onChange={(e) => setPercent(e.target.value)} className="admin-input" />
          </Field>
          <Field label="Velja do">
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="admin-input" />
          </Field>
          <Field label="Največ uporab">
            <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="neomejeno" className="admin-input" />
          </Field>
          <div className="sm:col-span-5">
            <button type="submit" disabled={busy} className="admin-btn">
              {busy ? <Spinner /> : <Plus className="h-4 w-4" />} Dodaj kodo
            </button>
          </div>
        </form>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <Card title="Obstoječe kode">
        {!codes ? (
          <LoadingBlock />
        ) : codes.length === 0 ? (
          <p className="py-6 text-center text-sm text-navy-800/50">Ni kod za popust.</p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {codes.map((c) => {
              const expired = c.expires_at !== null && new Date(c.expires_at) < new Date();
              const used = c.max_uses !== null && c.used_count >= c.max_uses;
              return (
                <li key={c.code} className="flex flex-wrap items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-medium text-navy-900">
                      {c.code} <span className="ml-2 font-sans text-gold-700">-{Number(c.percent)} %</span>
                    </p>
                    <p className="text-xs text-navy-800/50">
                      Uporabljeno {c.used_count}
                      {c.max_uses !== null && ` / ${c.max_uses}`}
                      {c.expires_at && ` · velja do ${formatDate(c.expires_at)}`}
                      {expired && <span className="text-red-600"> · poteklo</span>}
                      {used && <span className="text-red-600"> · porabljeno</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle checked={c.active} onChange={() => toggle(c)} label={`Aktivna koda ${c.code}`} />
                    <button type="button" onClick={() => remove(c)} aria-label={`Izbriši ${c.code}`} className="rounded-lg p-2 text-navy-300 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
