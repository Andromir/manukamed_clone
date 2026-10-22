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
      <Link to={href} className="relative block aspect-[4/5] overflow-hidden bg-cream-100">
        {product.badge && (
          <span className="absolute left-4 top-4 z-10 bg-white/95 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-navy-900">
            {product.badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-4 top-4 z-10 bg-navy-900/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
            Ni na zalogi
          </span>
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
        />
        <img
          src={product.images[1] ?? product.images[0]}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-105 object-contain opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
        />
        {product.mgo && (
          <span className="absolute bottom-4 right-4 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-navy-900/90 text-white backdrop-blur">
            <span className="text-[8px] uppercase tracking-[0.15em] text-gold-300">MGO</span>
            <span className="text-sm font-medium leading-none">{product.mgo}+</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-3">
          <Link to={href} className="text-sm font-normal uppercase leading-snug tracking-[0.12em] text-navy-900 transition-colors hover:text-gold-600">
            {product.name}
          </Link>
          {product.variants.length > 1 ? (
            <label className="relative shrink-0">
              <span className="sr-only">Velikost</span>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="appearance-none border border-navy-200 bg-white py-1.5 pl-3 pr-7 text-xs text-navy-900 focus:border-navy-700 focus:outline-none"
              >
                {product.variants.map((v) => (
                  <option key={v.size}>{v.size}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-navy-700" />
            </label>
          ) : (
            <span className="shrink-0 border border-navy-100 px-3 py-1.5 text-xs text-navy-800/70">{size}</span>
          )}
        </div>
        {showDetails && (
          <>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-navy-800/60">
              <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
              {product.rating.toLocaleString('sl-SI')} ({product.reviews})
            </div>
            <p className="mt-3 text-sm leading-relaxed text-navy-800/70">{product.short}</p>
          </>
        )}
        <div className="mt-auto pt-5">
          {outOfStock ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed border border-navy-200 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-navy-400"
            >
              Ni na zalogi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => add(product.slug, size)}
              className="w-full border border-navy-900 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-navy-900 transition-all duration-300 hover:bg-navy-900 hover:text-white"
            >
              Dodaj v košarico · {formatPrice(product.salePrice ?? variant.price)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
