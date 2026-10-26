import { ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product, showDetails = true }: { product: Product; showDetails?: boolean }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.variants[0].size);
  const variant = product.variants.find((v) => v.size === size) ?? product.variants[0];
  const href = `/izdelek/${product.slug}`;
  const outOfStock = product.stock <= 0;

  return (
    <article className="group flex h-full flex-col">
      <Link to={href} className="product-card-image relative block rounded-2xl bg-white">
        {product.badge && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold text-white">
            {product.badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-ink-900/90 px-3 py-1 text-[11px] font-semibold text-white">
            Ni na zalogi
          </span>
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 m-auto h-full w-full object-contain object-center transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
        />
        <img
          src={product.images[1] ?? product.images[0]}
          alt=""
          loading="lazy"
          className="absolute inset-0 m-auto h-full w-full scale-105 object-contain object-center opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
        />
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-3">
          <Link to={href} className="text-base font-semibold leading-snug text-ink-950 transition-colors hover:text-brand-600">
            {product.name}
          </Link>
          {product.variants.length > 1 ? (
            <label className="relative shrink-0">
              <span className="sr-only">Različica</span>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="appearance-none rounded-full border border-ink-200 bg-white py-1.5 pl-3 pr-7 text-xs text-ink-900 focus:border-ink-700 focus:outline-none"
              >
                {product.variants.map((v) => (
                  <option key={v.size}>{v.size}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-700" />
            </label>
          ) : (
            size && <span className="shrink-0 rounded-full border border-ink-100 px-3 py-1.5 text-xs text-ink-800/70">{size}</span>
          )}
        </div>
        {showDetails && (
          <>
            {product.reviews > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-800/60">
                <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
                {product.rating.toLocaleString('sl-SI')} ({product.reviews})
              </div>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink-800/70">{product.short}</p>
          </>
        )}
        <div className="mt-auto pt-5">
          {outOfStock ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-400"
            >
              Ni na zalogi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => add(product.slug, size)}
              className="w-full rounded-full bg-ink-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-brand-600"
            >
              Dodaj v košarico · {formatPrice(product.salePrice ?? variant.price)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
