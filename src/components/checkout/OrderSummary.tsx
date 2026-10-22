import { CheckCircle2, Plus, Repeat, Star } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { useContent, useStore } from '@/context/StoreContext';
import type { Product } from '@/data/products';
import { formatPrice } from '@/lib/format';

interface Props {
  shipping: number | null;
  paymentFee: number;
  paymentFeeLabel?: string;
}

const upsellSlugs = ['pastile-mgo400-cni-ribiz', 'bio30-propolis-brez-alkohola', 'pastile-mgo400-ingver-limona'];

export default function OrderSummary({ shipping, paymentFee, paymentFeeLabel = 'Strošek plačila' }: Props) {
  const cart = useCart();
  const { getProduct } = useStore();
  const images = useContent('images');
  const [applying, setApplying] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const upsells = upsellSlugs
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p) && !cart.lines.some((l) => l.slug === p?.slug))
    .slice(0, 2);

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
      <div className="flex items-center gap-2 border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800">
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
            <div className="relative h-16 w-16 shrink-0 border border-navy-100 bg-white">
              <img src={line.product.images[0]} alt={line.product.name} className="h-full w-full object-cover" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-navy-700 text-[11px] font-medium text-white">
                {line.qty}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-normal text-navy-900">{line.product.name}</p>
              <p className="text-xs text-navy-800/60">{line.size}</p>
              {line.subscribe && (
                <p className="flex items-center gap-1 text-xs text-gold-700">
                  <Repeat className="h-3 w-3" /> Redna dostava
                </p>
              )}
            </div>
            <span className="text-sm text-navy-900">{formatPrice(line.total)}</span>
          </li>
        ))}
      </ul>

      {upsells.length > 0 && (
        <div>
          <p className="text-center text-sm font-normal text-navy-900">Dopolnite svojo rutino</p>
          <div className="mt-3 space-y-3">
            {upsells.map((p) => (
              <div key={p.slug} className="flex items-center gap-4 border border-navy-100 bg-white p-4">
                <img src={p.images[0]} alt={p.name} className="h-14 w-14 object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-navy-900">{p.name}</p>
                  <p className="flex items-center gap-1 text-xs text-navy-800/60">
                    <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> {p.rating.toLocaleString('sl-SI')} ({p.reviews})
                  </p>
                  <p className="text-sm text-navy-900">{formatPrice(p.salePrice ?? p.variants[0].price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => cart.add(p.slug, p.variants[0].size, 1, false, false)}
                  className="flex items-center gap-1 bg-navy-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gold-600"
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
            <button type="submit" disabled={applying} className="border border-navy-200 bg-white px-5 text-sm disabled:opacity-50 text-navy-900 transition-colors hover:border-navy-900">
              Uporabi
            </button>
          </div>
          {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
        </form>
      )}

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-navy-800">
          <dt>Vmesni seštevek</dt>
          <dd>{formatPrice(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt>Popust</dt>
            <dd>−{formatPrice(cart.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-navy-800">
          <dt>Dostava</dt>
          <dd>{shipping === null ? <span className="text-navy-800/50">Izberite način dostave</span> : shipping === 0 ? 'Brezplačno' : formatPrice(shipping)}</dd>
        </div>
        {paymentFee > 0 && (
          <div className="flex justify-between text-navy-800">
            <dt>{paymentFeeLabel}</dt>
            <dd>{formatPrice(paymentFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-navy-100 pt-4">
          <dt className="text-lg font-medium text-navy-900">Skupaj</dt>
          <dd className="text-xl font-medium text-navy-900">
            <span className="mr-2 text-xs font-normal text-navy-800/50">EUR</span>
            {formatPrice(total)}
          </dd>
        </div>
        <p className="text-xs text-navy-800/50">Cene vključujejo DDV.</p>
      </dl>

      <div className="relative hidden overflow-hidden lg:block">
        <img src={images.beesOnComb} alt="" className="h-56 w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-navy-950/55 p-8">
          {['Zagotovljen MGO™', '100 % iz Nove Zelandije', 'Redek, čist in močan'].map((t) => (
            <p key={t} className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-white">
              <CheckCircle2 className="h-5 w-5 text-gold-300" strokeWidth={1.5} /> {t}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
