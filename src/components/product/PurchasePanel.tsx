import { Check, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Accordion from '@/components/ui/Accordion';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useContent, useStore } from '@/context/StoreContext';
import { getCategory, type Product } from '@/data/products';
import { PAYMENT_METHOD_IDS } from '@/data/settings';
import { formatPrice } from '@/lib/format';

export default function PurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const { settings } = useStore();
  const productText = useContent('product');
  const [size, setSize] = useState(product.variants[0].size);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

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
    add(product.slug, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div>
      <p className="text-sm text-ink-500">
        <Link to="/trgovina" className="hover:text-brand-600">Vsi izdelki</Link>
        {category && (
          <>
            {' / '}
            <Link to={`/trgovina/${category.slug}`} className="hover:text-brand-600">{category.name}</Link>
          </>
        )}
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-ink-950 sm:text-5xl">{product.name}</h1>
      <div className="mt-4 flex items-center gap-3">
        {product.reviews > 0 && (
          <>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(product.rating) ? 'fill-brand-500 text-brand-500' : 'text-ink-200'}`} />
              ))}
            </div>
            <span className="text-xs text-ink-500">
              {product.rating.toLocaleString('sl-SI')} · {product.reviews} ocen
            </span>
          </>
        )}
        {outOfStock ? (
          <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">Ni na zalogi</span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Na zalogi</span>
        )}
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-4xl font-bold text-ink-950">{formatPrice(displayPrice)}</span>
        {product.salePrice && (
          <>
            <span className="text-base text-ink-400 line-through">{formatPrice(variant.price)}</span>
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">Akcija</span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-500">Cena vključuje DDV.</p>

      <p className="mt-6 text-sm leading-relaxed text-ink-700">{product.description}</p>

      {product.variants.length > 1 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-ink-950">Različica</p>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.size}
                type="button"
                onClick={() => setSize(v.size)}
                className={`min-w-[96px] rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                  size === v.size ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 text-ink-900 hover:border-ink-950'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <QuantityStepper value={qty} onChange={setQty} />
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock}
          className={`flex-1 transition-all ${
            outOfStock
              ? 'cursor-not-allowed rounded-full border border-ink-200 text-sm font-semibold text-ink-400'
              : 'btn-brand'
          }`}
        >
          {outOfStock ? (
            'Ni na zalogi'
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Dodano
            </>
          ) : (
            <>Dodaj v košarico · {formatPrice(displayPrice * qty)}</>
          )}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-ink-600">
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-brand-600" strokeWidth={1.75} /> Brezplačna dostava nad {formatPrice(settings.free_shipping_threshold)}
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" strokeWidth={1.75} /> Varno plačilo
        </span>
      </div>

      <div className="mt-10">
        <Accordion items={purchaseInfo} />
      </div>
    </div>
  );
}
