import { Plus, Trash2 } from 'lucide-react';
import { Card, Field, Toggle } from '@/components/admin/ui';
import type { ShippingMethod, StoreSettings } from '@/data/settings';

interface Props {
  value: StoreSettings;
  onChange: (patch: Partial<StoreSettings>) => void;
}

export default function ShippingSettings({ value, onChange }: Props) {
  const methods = value.shipping_methods;
  const setMethod = (i: number, patch: Partial<ShippingMethod>) =>
    onChange({ shipping_methods: methods.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  return (
    <div className="space-y-6">
      <Card title="Načini dostave" description="Kupec na blagajni izbere enega od vključenih načinov. Prvi vključen način se uporablja za izračun v košarici.">
        <div className="space-y-4">
          {methods.map((m, i) => (
            <div key={m.id} className={`rounded-xl border p-4 transition-colors ${m.enabled ? 'border-ink-100' : 'border-dashed border-ink-100 bg-ink-50/30'}`}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Toggle checked={m.enabled} onChange={(v) => setMethod(i, { enabled: v })} label={`Vključi ${m.label}`} />
                  <span className="text-sm font-medium text-ink-900">{m.label || 'Nov način dostave'}</span>
                </div>
                <button
                  type="button"
                  disabled={methods.length === 1}
                  onClick={() => onChange({ shipping_methods: methods.filter((_, j) => j !== i) })}
                  aria-label="Odstrani način dostave"
                  className="rounded-lg p-2 text-ink-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Naziv">
                  <input value={m.label} onChange={(e) => setMethod(i, { label: e.target.value })} className="admin-input" />
                </Field>
                <Field label="Rok dostave">
                  <input value={m.eta} onChange={(e) => setMethod(i, { eta: e.target.value })} placeholder="1–3 delovne dni" className="admin-input" />
                </Field>
                <Field label="Cena (EUR)">
                  <input type="number" min="0" step="0.01" value={m.price} onChange={(e) => setMethod(i, { price: Math.max(0, Number(e.target.value) || 0) })} className="admin-input" />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ shipping_methods: [...methods, { id: `dostava-${Date.now().toString(36)}`, label: '', eta: '', price: 0, enabled: false }] })}
            className="admin-btn-secondary"
          >
            <Plus className="h-4 w-4" /> Dodaj način dostave
          </button>
        </div>
      </Card>

      <Card title="Brezplačna dostava in naročnine">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brezplačna dostava nad (EUR)" hint="Vnesite 0 za vedno brezplačno dostavo.">
            <input
              type="number"
              min="0"
              step="1"
              value={value.free_shipping_threshold}
              onChange={(e) => onChange({ free_shipping_threshold: Math.max(0, Number(e.target.value) || 0) })}
              className="admin-input"
            />
          </Field>
          <Field label="Popust za naročnino (%)" hint="Popust, ko kupec izbere redno dostavo izdelka.">
            <input
              type="number"
              min="0"
              max="90"
              value={value.subscribe_discount}
              onChange={(e) => onChange({ subscribe_discount: Math.min(90, Math.max(0, Number(e.target.value) || 0)) })}
              className="admin-input"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
