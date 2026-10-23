import { useState } from 'react';
import type { Product } from '@/data/products';

export default function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto sm:w-20 sm:flex-col">
        {product.images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Slika ${i + 1}`}
            className={`aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-mist-100 transition-all ${
              active === i ? 'border-ink-950' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-mist-100">
        {product.badge && (
          <span className="absolute left-5 top-5 z-10 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white">
            {product.badge}
          </span>
        )}
        {product.images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              active === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
