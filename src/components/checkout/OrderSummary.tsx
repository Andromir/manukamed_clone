import { CheckCircle2, Plus, Repeat, Star } from 'lucide-react';
import BrandBall from '@/components/ui/BrandBall';
import { useState, type FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/lib/format';

interface Props {
  shipping: number | null;
  paymentFee: number;
  paymentFeeLabel?: string;
}

export default function OrderSummary({ shipping, paymentFee, paymentFeeLabel = 'Strošek plačila' }: Props) {
  const cart = useCart();
  const { bestSellers } = useStore();
  const [applying, setApplying] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const upsells = bestSellers.filter((p) => p.stock > 0 && !cart.lines.some((l) => l.slug === p.slug)).slice(0, 2);

  const total = cart.subtotal - cart.discount + (shipping ?? 0) + paymentFee;

  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || applying) return;
    setApplying(true);
    const ok = await cart.applyCode(code);
    setApplying(false);
    if (ok) {
      setCode('');
      setCodeError('');
    } else setCodeError('Koda za popust ni veljavna ali je potekla.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border border-ink-100 bg-white px-4 py-3 text-sm text-ink-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        {cart.freeShippingLeft > 0 ? (
          <span>
            Še {formatPrice(cart.freeShippingLeft)} do <strong className="font-medium">brezplačne dostave</strong>
          </span>
        ) : (
          <span>
            Čestitamo! Prislužili ste si <strong className="font-medium">brezplačno dostavo</strong>.
          </span>
        )}
      </div>

      <ul className="space-y-4">
        {cart.lines.map((line) => (
          <li key={line.key} className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 border border-ink-100 bg-white">
              <img src={line.product.images[0]} alt={line.product.name} className="h-full w-full object-cover" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink-700 text-[11px] font-medium text-white">
                {line.qty}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-normal text-ink-900">{line.product.name}</p>
              <p className="text-xs text-ink-800/60">{line.size}</p>
              {line.subscribe && (
                <p className="flex items-center gap-1 text-xs text-brand-700">
                  <Repeat className="h-3 w-3" /> Redna dostava
                </p>
              )}
            </div>
            <span className="text-sm text-ink-900">{formatPrice(line.total)}</span>
          </li>
        ))}
      </ul>

      {upsells.length > 0 && (
        <div>
          <p className="text-center text-sm font-normal text-ink-900">Morda potrebujete še</p>
          <div className="mt-3 space-y-3">
            {upsells.map((p) => (
              <div key={p.slug} className="flex items-center gap-4 border border-ink-100 bg-white p-4">
                <img src={p.images[0]} alt={p.name} className="h-14 w-14 object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-ink-900">{p.name}</p>
                  {p.reviews > 0 && (
                    <p className="flex items-center gap-1 text-xs text-ink-800/60">
                      <Star className="h-3 w-3 fill-brand-500 text-brand-500" /> {p.rating.toLocaleString('sl-SI')} ({p.reviews})
                    </p>
                  )}
                  <p className="text-sm text-ink-900">{formatPrice(p.salePrice ?? p.variants[0].price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => cart.add(p.slug, p.variants[0].size, 1, false, false)}
                  className="flex items-center gap-1 rounded-full bg-ink-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Dodaj
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cart.discountCode ? (
        <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>
            Koda <strong className="font-medium">{cart.discountCode}</strong> (−{cart.discountPercent.toLocaleString('sl-SI')} %)
          </span>
          <button type="button" onClick={cart.removeCode} className="text-xs underline">
            Odstrani
          </button>
        </div>
      ) : (
        <form onSubmit={onApply}>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Koda za popust" className="input bg-white" />
            <button type="submit" disabled={applying} className="border border-ink-200 bg-white px-5 text-sm disabled:opacity-50 text-ink-900 transition-colors hover:border-ink-900">
              Uporabi
            </button>
          </div>
          {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
        </form>
      )}

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-ink-800">
          <dt>Vmesni seštevek</dt>
          <dd>{formatPrice(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt>Popust</dt>
            <dd>−{formatPrice(cart.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-ink-800">
          <dt>Dostava</dt>
          <dd>{shipping === null ? <span className="text-ink-800/50">Izberite način dostave</span> : shipping === 0 ? 'Brezplačno' : formatPrice(shipping)}</dd>
        </div>
        {paymentFee > 0 && (
          <div className="flex justify-between text-ink-800">
            <dt>{paymentFeeLabel}</dt>
            <dd>{formatPrice(paymentFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-ink-100 pt-4">
          <dt className="text-lg font-medium text-ink-900">Skupaj</dt>
          <dd className="text-xl font-medium text-ink-900">
            <span className="mr-2 text-xs font-normal text-ink-800/50">EUR</span>
            {formatPrice(total)}
          </dd>
        </div>
        <p className="text-xs text-ink-800/50">Cene vključujejo DDV.</p>
      </dl>

      <div className="relative hidden overflow-hidden rounded-2xl bg-ink-950 p-8 lg:block">
        <BrandBall className="absolute -right-10 -top-10 h-36 w-36" />
        <div className="relative flex flex-col gap-3">
          {['Novi izdelki z garancijo', 'Hitra dostava po Sloveniji', 'Vračilo v 14 dneh'].map((t) => (
            <p key={t} className="flex items-center gap-3 text-sm font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-brand-400" strokeWidth={1.75} /> {t}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
