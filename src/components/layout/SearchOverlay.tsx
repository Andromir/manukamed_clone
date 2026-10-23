import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/lib/format';

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const { products } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return products.filter((p) => normalize(`${p.name} ${p.short}`).includes(q)).slice(0, 6);
  }, [query, products]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/60" onClick={onClose} />
      <div className="relative animate-fade-up bg-white">
        <div className="container-x py-8">
          <div className="flex items-center gap-4 border-b border-ink-900 pb-4">
            <Search className="h-5 w-5 text-ink-700" strokeWidth={1.5} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Iščite izdelke, npr. telefon ali slušalke"
              className="flex-1 bg-transparent text-xl font-light text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
            <button type="button" onClick={onClose} aria-label="Zapri iskanje" className="text-ink-900 hover:text-brand-500">
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          {query.trim() && (
            <div className="mt-6">
              {results.length === 0 ? (
                <p className="py-6 text-sm text-ink-800/60">Za »{query}« ni zadetkov.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link to={`/izdelek/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-mist-100">
                        <img src={p.images[0]} alt={p.name} className="h-16 w-16 rounded-lg bg-mist-100 object-cover" />
                        <span>
                          <span className="block text-sm text-ink-900 group-hover:text-brand-600">{p.name}</span>
                          <span className="text-xs text-ink-800/60">od {formatPrice(p.variants[0].price)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
