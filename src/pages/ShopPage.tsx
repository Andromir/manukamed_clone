import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ComparisonPanel from '@/components/sections/ComparisonPanel';
import FaqSection from '@/components/sections/FaqSection';
import MgoBadge from '@/components/sections/MgoBadge';
import SplitFeature from '@/components/sections/SplitFeature';
import ProductCard from '@/components/shop/ProductCard';
import PageLoader from '@/components/ui/PageLoader';
import { useContent, useStore } from '@/context/StoreContext';
import { categories, getCategory, type Product } from '@/data/products';
import { pluralizeItems } from '@/lib/format';
import NotFoundPage from '@/pages/NotFoundPage';

type SortKey = 'priporoceno' | 'cena-nar' | 'cena-pad' | 'mgo-pad';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'priporoceno', label: 'Priporočeno' },
  { value: 'cena-nar', label: 'Cena: od najnižje' },
  { value: 'cena-pad', label: 'Cena: od najvišje' },
  { value: 'mgo-pad', label: 'MGO: od najvišje' },
];

const mgoRanges = [
  { id: 'vsakdanji', label: 'MGO 30+ – 100+', min: 0, max: 100 },
  { id: 'srednji', label: 'MGO 250+ – 400+', min: 101, max: 400 },
  { id: 'visok', label: 'MGO 573+ in več', min: 401, max: 10000 },
];

export default function ShopPage() {
  const { category: categorySlug } = useParams();
  const category = getCategory(categorySlug);
  const { products, loading, error } = useStore();
  const shopText = useContent('shop');
  const [sort, setSort] = useState<SortKey>('priporoceno');
  const [range, setRange] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(() => {
    let items = category ? products.filter((p) => p.category === category.slug) : products;
    const r = mgoRanges.find((m) => m.id === range);
    if (r) items = items.filter((p) => p.mgo !== undefined && p.mgo >= r.min && p.mgo <= r.max);
    const sorted = [...items];
    const price = (p: Product) => p.salePrice ?? p.variants[0].price;
    if (sort === 'cena-nar') sorted.sort((a, b) => price(a) - price(b));
    if (sort === 'cena-pad') sorted.sort((a, b) => price(b) - price(a));
    if (sort === 'mgo-pad') sorted.sort((a, b) => (b.mgo ?? 0) - (a.mgo ?? 0));
    return sorted;
  }, [category, range, sort, products]);

  if (categorySlug && !category) return <NotFoundPage />;

  const title = category?.title ?? 'Vsi izdelki';
  const subtitle = category?.subtitle ?? 'Trgovina ManukaMed';
  const intro = category?.intro ?? 'Certificiran manuka med, čebelji dodatki in naravna nega – vse na enem mestu.';
  const isCategory = Boolean(category);

  return (
    <>
      {isCategory && category ? (
        <section className="relative flex h-[52vh] min-h-[380px] items-end overflow-hidden">
          <img src={category.heroImage} alt="" className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/45 to-navy-950/20" />
          <div className="container-x relative pb-14 text-white sm:pb-20">
            <p className="animate-fade-up text-xs uppercase tracking-[0.2em] text-gold-300">
              <Link to="/" className="hover:text-white">Domov</Link> / <Link to="/trgovina" className="hover:text-white">Trgovina</Link> / {category.name}
            </p>
            <h1 className="mt-5 max-w-3xl animate-fade-up text-4xl font-normal uppercase leading-tight tracking-[0.1em] sm:text-5xl" style={{ animationDelay: '0.1s' }}>
              {title}
            </h1>
            <p className="mt-4 animate-fade-up text-sm font-medium uppercase tracking-widest2 text-gold-200" style={{ animationDelay: '0.18s' }}>
              {subtitle}
            </p>
            <p className="mt-4 max-w-xl animate-fade-up text-sm leading-relaxed text-white/85" style={{ animationDelay: '0.26s' }}>
              {intro}
            </p>
          </div>
        </section>
      ) : (
        <section className="container-x pb-12 pt-16 text-center sm:pt-20">
          <p className="text-xs uppercase tracking-[0.2em] text-navy-800/50">
            <Link to="/" className="hover:text-gold-600">Domov</Link> / <Link to="/trgovina" className="hover:text-gold-600">Trgovina</Link>
          </p>
          <h1 className="heading-xl mt-6 animate-fade-up">{title}</h1>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest2 text-navy-900">{subtitle}</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-navy-800/70">{intro}</p>
        </section>
      )}

      <div className="container-x">
        {!isCategory && (
          <div className="flex flex-wrap items-center justify-center gap-2 pb-10">
            {[{ slug: undefined, name: 'Vse' }, ...categories].map((c) => {
              const active = c.slug === category?.slug || (!isCategory && !c.slug);
              return (
                <Link
                  key={c.name}
                  to={c.slug ? `/trgovina/${c.slug}` : '/trgovina'}
                  className={`rounded-full border px-5 py-2 text-xs uppercase tracking-[0.16em] transition-all ${
                    active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 text-navy-800 hover:border-navy-900'
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-y border-navy-100 py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-navy-900 hover:text-gold-600"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} /> Filter
            {range && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] text-white">1</span>}
          </button>
          <p className="hidden text-xs text-navy-800/60 sm:block">{pluralizeItems(list.length)}</p>
          <label className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-navy-900">
            <span className="hidden sm:inline">Razvrsti:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none bg-transparent pr-6 text-xs font-medium uppercase tracking-[0.12em] focus:outline-none"
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
            <div className="flex flex-wrap items-center gap-3 border-b border-navy-100 py-5">
              <span className="mr-2 text-xs uppercase tracking-[0.16em] text-navy-800/60">Stopnja MGO:</span>
              {mgoRanges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(range === r.id ? null : r.id)}
                  className={`border px-4 py-2 text-xs transition-all ${
                    range === r.id ? 'border-gold-600 bg-gold-50 text-gold-800' : 'border-navy-200 text-navy-800 hover:border-navy-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              {range && (
                <button type="button" onClick={() => setRange(null)} className="flex items-center gap-1 text-xs text-navy-800/60 underline hover:text-navy-900">
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
            <p className="text-lg text-navy-900">Ni izdelkov, ki bi ustrezali izbiri.</p>
            <button type="button" onClick={() => setRange(null)} className="btn-outline mt-6">
              Počisti filtre
            </button>
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

      <div className="mt-16">
        <ComparisonPanel />
        {shopText.features.map((f, i) => (
          <SplitFeature
            key={f.title + i}
            reverse={i % 2 === 1}
            image={f.image}
            imageAlt={f.title}
            tone={i === 0 ? 'cream' : undefined}
            eyebrow={f.eyebrow}
            title={f.title}
            link={f.linkTo ? { to: f.linkTo, label: f.linkLabel } : undefined}
            overlay={i === 0 ? <MgoBadge /> : undefined}
          >
            <p>{f.text}</p>
          </SplitFeature>
        ))}
      </div>

      <FaqSection />
    </>
  );
}
