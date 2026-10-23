import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { uploadImage } from '@/lib/media';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-800/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, actions }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="admin-card">
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-medium text-ink-900">{title}</h2>}
            {description && <p className="mt-1 text-sm text-ink-800/60">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="admin-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-800/50">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-emerald-600' : 'bg-ink-200'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Notice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-ink-100 bg-ink-50 text-ink-800',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset, message }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void; message?: ReactNode }) {
  if (!dirty && !message) return null;
  return (
    <div className="sticky bottom-4 z-20 mt-8 flex animate-fade-up items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
      <div className="text-sm text-ink-800">{message ?? 'Imate neshranjene spremembe.'}</div>
      {dirty && (
        <div className="flex gap-2">
          {onReset && (
            <button type="button" onClick={onReset} disabled={saving} className="admin-btn-secondary">
              Zavrzi
            </button>
          )}
          <button type="button" onClick={onSave} disabled={saving} className="admin-btn">
            {saving && <Spinner />} Shrani spremembe
          </button>
        </div>
      )}
    </div>
  );
}

export function ImageInput({ value, onChange, folder, onRemove, compact }: { value: string; onChange: (url: string) => void; folder: string; onRemove?: () => void; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nalaganje ni uspelo.');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div>
      <div className={`group relative overflow-hidden rounded-lg border border-ink-100 bg-ink-50 ${compact ? 'aspect-square' : 'aspect-[16/10]'}`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <ImagePlus className="h-8 w-8" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-brand-50">
            {value ? 'Zamenjaj' : 'Naloži'}
          </button>
          {onRemove && (
            <button type="button" onClick={onRemove} aria-label="Odstrani sliko" className="rounded-md bg-white p-1.5 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner className="h-6 w-6 text-ink-700" />
          </div>
        )}
      </div>
      {!compact && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="ali prilepite URL slike" className="admin-input mt-2 text-xs" />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
