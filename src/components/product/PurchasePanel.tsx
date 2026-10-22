import { Check, ChevronDown, Repeat, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Accordion from '@/components/ui/Accordion';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useContent, useStore } from '@/context/StoreContext';
import { getCategory, unitPrice, type Product } from '@/data/products';
import { PAYMENT_METHOD_IDS } from '@/data/settings';
import { formatPrice } from '@/lib/format';

const intervals = ['Vsak mesec', 'Vsaka 2 meseca', 'Vsake 3 mesece'];


export default function PurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const { settings } = useStore();
  const productText = useContent('product');
  const subscribePct = settings.subscribe_discount;
  const [size, setSize] = useState(product.variants[0].size);
  const [subscribe, setSubscribe] = useState(false);
  const [frequency, setFrequency] = useState(intervals[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const oncePrice = unitPrice(product, size, false, subscribePct);
  const subPrice = unitPrice(product, size, true, subscribePct);
  const paymentLabels = PAYMENT_METHOD_IDS.filter((id) => settings.payment_methods[id]?.enabled).map((id) => settings.payment_methods[id].label);
  const shippingFrom = settings.shipping_methods.filter((m) => m.enabled && m.price > 0).map((m) => m.price);
  const purchaseInfo = [
    { title: 'Načini plačila', content: paymentLabels.join(', ') + '.' },
    {
      title: 'Dostava',
      content: `${shippingFrom.length ? `Dostava od ${formatPrice(Math.min(...shippingFrom))}, ` : ''}nad ${formatPrice(settings.free_shipping_threshold)} brezplačno. ${productText.shippingNote}`.trim(),
    },
    { title: 'Vračila', content: productText.returnsText },
  ];
  const category = getCategory(product.category);
  const outOfStock = product.stock <= 0;
  const variant = product.variants.find((v) => v.size === size) ?? product.variants[0];
  const displayPrice = product.salePrice ?? variant.price;

  const onAdd = () => {
    add(product.slug, size, qty, subscribe);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-navy-800/50">
        <Link to="/trgovina" className="hover:text-gold-600">Vsi izdelki</Link>
        {category && (
          <>
            {' / '}
            <Link to={`/trgovina/${category.slug}`} className="hover:text-gold-600">{category.name}</Link>
          </>
        )}
      </p>
      <h1 className="mt-5 text-3xl font-normal uppercase leading-tight tracking-[0.12em] text-navy-900 sm:text-4xl">{product.name}</h1>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= Math.round(product.rating) ? 'fill-gold-500 text-gold-500' : 'text-navy-200'}`} />
          ))}
        </div>
        <span className="text-xs text-navy-800/60">
          {product.rating.toLocaleString('sl-SI')} · {product.reviews} ocen
        </span>
        {outOfStock && (
          <span className="ml-auto rounded bg-navy-900 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
            Ni na zalogi
          </span>
        )}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-navy-800/75">{product.description}</p>

      {product.variants.length > 1 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-navy-900">Velikost</p>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.size}
                type="button"
                onClick={() => setSize(v.size)}
                className={`min-w-[88px] border px-5 py-3 text-sm transition-all ${
                  size === v.size ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 text-navy-900 hover:border-navy-900'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.salePrice && (
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-2xl font-medium text-navy-900">{formatPrice(product.salePrice)}</span>
          <span className="text-sm text-navy-800/40 line-through">{formatPrice(variant.price)}</span>
          <span className="rounded-sm bg-gold-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            Akcija
          </span>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-navy-900">Način nakupa</p>
        <button
          type="button"
          onClick={() => setSubscribe(false)}
          className={`flex w-full items-center justify-between border px-5 py-4 text-left transition-all ${
            !subscribe ? 'border-navy-900 bg-cream-50' : 'border-navy-100 hover:border-navy-300'
          }`}
        >
          <span className="flex items-center gap-3">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${!subscribe ? 'border-navy-900' : 'border-navy-300'}`}>
              {!subscribe && <span className="h-2.5 w-2.5 rounded-full bg-navy-900" />}
            </span>
            <span className="text-sm font-normal text-navy-900">Enkraten nakup</span>
          </span>
          <span className="text-sm text-navy-900">{formatPrice(oncePrice)}</span>
        </button>
        <div className={`border transition-all ${subscribe ? 'border-navy-900 bg-cream-50' : 'border-navy-100 hover:border-navy-300'}`}>
          <button type="button" onClick={() => setSubscribe(true)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <span className="flex items-center gap-3">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${subscribe ? 'border-navy-900' : 'border-navy-300'}`}>
                {subscribe && <span className="h-2.5 w-2.5 rounded-full bg-navy-900" />}
              </span>
              <span>
                <span className="flex items-center gap-2 text-sm font-normal text-navy-900">
                  <Repeat className="h-3.5 w-3.5 text-gold-600" /> Redna dostava
                </span>
                <span className="mt-0.5 block text-xs text-navy-800/60">Prihranite {subscribePct} % pri vsakem naročilu</span>
              </span>
            </span>
            <span className="text-right">
              <span className="block rounded-sm bg-gold-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                −{subscribePct} %
              </span>
              <span className="mt-1 block text-sm text-navy-900">{formatPrice(subPrice)}</span>
              <span className="block text-xs text-navy-800/40 line-through">{formatPrice(oncePrice)}</span>
            </span>
          </button>
          {subscribe && (
            <div className="animate-fade-in px-5 pb-4 pl-[52px]">
              <label className="relative block">
                <span className="sr-only">Pogostost dostave</span>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full appearance-none border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-navy-700 focus:outline-none"
                >
                  {intervals.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700" />
              </label>
              <p className="mt-2 text-xs text-navy-800/60">Naročnino lahko kadarkoli spremenite ali prekličete.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <QuantityStepper value={qty} onChange={setQty} />
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock}
          className={`flex-1 transition-all ${
            outOfStock
              ? 'cursor-not-allowed border border-navy-200 text-navy-400'
              : 'btn-primary'
          }`}
        >
          {outOfStock ? (
            'Ni na zalogi'
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Dodano
            </>
          ) : (
            <>Dodaj v košarico · {formatPrice((subscribe ? subPrice : displayPrice) * qty)}</>
          )}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-navy-800/70">
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gold-600" strokeWidth={1.5} /> Brezplačna dostava nad 50 €
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold-600" strokeWidth={1.5} /> Varno plačilo
        </span>
      </div>

      <div className="mt-10">
        <Accordion items={purchaseInfo} />
      </div>
    </div>
  );
}
