import { useState } from 'react';
import type { Product } from '@/data/products';

export default function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row-reverse">
      <div className="product-main-image relative w-full overflow-hidden rounded-3xl bg-mist-100">
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
            className={`absolute inset-0 m-auto h-full w-full object-contain object-center p-[8%] transition-all duration-700 ${
              active === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        ))}
      </div>
      <div className="no-scrollbar flex max-h-[340px] gap-3 overflow-x-auto pb-1 sm:max-h-[500px] sm:w-20 sm:flex-col sm:overflow-y-auto sm:pb-0">
        {product.images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Slika ${i + 1}`}
            className={`aspect-square h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-mist-100 p-1.5 transition-all sm:h-auto sm:w-full ${
              active === i ? 'border-brand-600' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-contain object-center" />
          </button>
        ))}
      </div>
    </div>
  );
}
