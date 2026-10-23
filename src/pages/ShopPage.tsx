import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FaqSection from '@/components/sections/FaqSection';
import { categoryIcons } from '@/components/shop/categoryIcons';
import ProductCard from '@/components/shop/ProductCard';
import BrandBall from '@/components/ui/BrandBall';
import PageLoader from '@/components/ui/PageLoader';
import { useStore } from '@/context/StoreContext';
import { categories, getCategory, type Product } from '@/data/products';
import { pluralizeItems } from '@/lib/format';
import NotFoundPage from '@/pages/NotFoundPage';

type SortKey = 'priporoceno' | 'cena-nar' | 'cena-pad';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'priporoceno', label: 'Priporočeno' },
  { value: 'cena-nar', label: 'Cena: od najnižje' },
  { value: 'cena-pad', label: 'Cena: od najvišje' },
];

const priceRanges = [
  { id: 'do-200', label: 'Do 200 €', min: 0, max: 200 },
  { id: '200-500', label: '200–500 €', min: 200, max: 500 },
  { id: '500-1000', label: '500–1.000 €', min: 500, max: 1000 },
  { id: 'nad-1000', label: 'Nad 1.000 €', min: 1000, max: Infinity },
];

const price = (p: Product) => p.salePrice ?? p.variants[0].price;

export default function ShopPage() {
  const { category: categorySlug } = useParams();
  const category = getCategory(categorySlug);
  const { products, loading, error } = useStore();
  const [sort, setSort] = useState<SortKey>('priporoceno');
  const [range, setRange] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(() => {
    let items = category ? products.filter((p) => p.category === category.slug) : products;
    const r = priceRanges.find((m) => m.id === range);
    if (r) items = items.filter((p) => price(p) >= r.min && price(p) < r.max);
    const sorted = [...items];
    if (sort === 'cena-nar') sorted.sort((a, b) => price(a) - price(b));
    if (sort === 'cena-pad') sorted.sort((a, b) => price(b) - price(a));
    return sorted;
  }, [category, range, sort, products]);

  if (categorySlug && !category) return <NotFoundPage />;

  const title = category?.title ?? 'Vsi izdelki';
  const intro = category?.intro ?? 'Telefoni, računalniki, TV in avdio, omrežna oprema in dodatki – vse na enem mestu.';
  const Icon = category ? categoryIcons[category.slug] : null;

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <BrandBall className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-90 sm:h-[26rem] sm:w-[26rem]" />
        <div className="container-x relative pb-14 pt-12 sm:pb-16 sm:pt-16">
          <p className="text-xs font-medium text-ink-300">
            <Link to="/" className="hover:text-white">Domov</Link> / <Link to="/trgovina" className="hover:text-white">Trgovina</Link>
            {category && <> / {category.name}</>}
          </p>
          <div className="mt-6 flex items-center gap-4">
            {Icon && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
            )}
            <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
          </div>
          <p className="mt-5 max-w-xl animate-fade-up text-sm leading-relaxed text-ink-200 sm:text-base" style={{ animationDelay: '0.1s' }}>
            {intro}
          </p>
        </div>
      </section>

      <div className="container-x">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-6 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ slug: undefined, name: 'Vse' }, ...categories].map((c) => {
            const active = c.slug === category?.slug || (!category && !c.slug);
            return (
              <Link
                key={c.name}
                to={c.slug ? `/trgovina/${c.slug}` : '/trgovina'}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                  active ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 text-ink-800 hover:border-ink-950'
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-y border-ink-100 py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-brand-600"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} /> Filter
            {range && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">1</span>}
          </button>
          <p className="hidden text-sm text-ink-500 sm:block">{pluralizeItems(list.length)}</p>
          <label className="relative flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="hidden sm:inline">Razvrsti:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold focus:outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5" />
          </label>
        </div>

        <div className={`grid overflow-hidden transition-all duration-500 ${filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 py-5">
              <span className="mr-2 text-sm text-ink-500">Cena:</span>
              {priceRanges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(range === r.id ? null : r.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all ${
                    range === r.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-800 hover:border-ink-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              {range && (
                <button type="button" onClick={() => setRange(null)} className="flex items-center gap-1 text-sm text-ink-500 underline hover:text-ink-900">
                  <X className="h-3 w-3" /> Počisti
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoader label="Nalaganje izdelkov …" />
        ) : error ? (
          <p className="py-24 text-center text-sm text-red-700">{error}</p>
        ) : list.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-bold text-ink-950">
              {range ? 'Ni izdelkov, ki bi ustrezali izbiri.' : 'V tej kategoriji še ni izdelkov.'}
            </p>
            {range ? (
              <button type="button" onClick={() => setRange(null)} className="btn-outline mt-6">
                Počisti filtre
              </button>
            ) : (
              <Link to="/trgovina" className="btn-outline mt-6">
                Vsi izdelki
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p, i) => (
              <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <FaqSection />
      </div>
    </>
  );
}
