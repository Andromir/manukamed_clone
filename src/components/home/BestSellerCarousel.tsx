import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import type { Product } from '@/data/products';

export default function BestSellerCarousel({ items }: { items: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [visibleRatio, setVisibleRatio] = useState(0.5);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      setVisibleRatio(Math.min(1, el.clientWidth / el.scrollWidth));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const barWidth = visibleRatio * 100;

  return (
    <div className="relative">
      <div ref={trackRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 sm:gap-6 sm:px-6 lg:px-10">
        {items.map((p) => (
          <div key={p.slug} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {[-1, 1].map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={() => scroll(dir as 1 | -1)}
          aria-label={dir === -1 ? 'Prejšnji' : 'Naslednji'}
          className={`absolute top-[32%] hidden h-12 w-12 items-center justify-center rounded-full bg-white text-ink-900 shadow-lg transition-all hover:bg-ink-900 hover:text-white md:flex ${
            dir === -1 ? 'left-4' : 'right-4'
          } ${(dir === -1 && progress < 0.01) || (dir === 1 && progress > 0.99) ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        >
          {dir === -1 ? <ChevronLeft className="h-5 w-5" strokeWidth={1.5} /> : <ChevronRight className="h-5 w-5" strokeWidth={1.5} />}
        </button>
      ))}
      <div className="mx-auto mt-12 h-0.5 w-48 bg-ink-100">
        <div className="h-full bg-ink-900 transition-[margin] duration-300" style={{ width: `${barWidth}%`, marginLeft: `${progress * (100 - barWidth)}%` }} />
      </div>
    </div>
  );
}
