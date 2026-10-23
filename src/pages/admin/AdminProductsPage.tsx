import { ImageOff, Plus, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingBlock, Notice, PageHeader, Toggle } from '@/components/admin/ui';
import { useStore } from '@/context/StoreContext';
import { formatEur } from '@/data/orders';
import { categories, mapProduct, type Product, type ProductRow } from '@/data/products';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | 'published' | 'hidden' | 'low';

export default function AdminProductsPage() {
  const { reload } = useStore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('sort_order')
      .order('name')
      .then(({ data, error: err }) => {
        if (err) setError('Izdelkov ni bilo mogoče naložiti.');
        else setProducts((data as ProductRow[]).map(mapProduct));
      });
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.includes(q)) return false;
      if (category && p.category !== category) return false;
      if (filter === 'published' && !p.isPublished) return false;
      if (filter === 'hidden' && p.isPublished) return false;
      if (filter === 'low' && p.stock > 3) return false;
      return true;
    });
  }, [products, query, category, filter]);

  const patch = async (id: string, changes: Partial<Pick<ProductRow, 'is_published' | 'is_bestseller'>>) => {
    setProducts((list) =>
      list?.map((p) =>
        p.id === id
          ? { ...p, isPublished: changes.is_published ?? p.isPublished, isBestseller: changes.is_bestseller ?? p.isBestseller }
          : p,
      ) ?? null,
    );
    const { error: err } = await supabase.from('products').update(changes).eq('id', id);
    if (err) setError('Sprememba ni bila shranjena. Osvežite stran in poskusite znova.');
    else reload();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Izdelki"
        description={products ? `${products.length} izdelkov, ${products.filter((p) => p.isPublished).length} objavljenih` : undefined}
        actions={
          <Link to="/admin/izdelki/nov" className="admin-btn">
            <Plus className="h-4 w-4" /> Nov izdelek
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Iskanje po imenu" className="admin-input pl-9" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="admin-input md:w-48">
          <option value="">Vse kategorije</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="admin-input md:w-48">
          <option value="all">Vsi izdelki</option>
          <option value="published">Objavljeni</option>
          <option value="hidden">Skriti</option>
          <option value="low">Nizka zaloga</option>
        </select>
      </div>

      {!products ? (
        <LoadingBlock />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wider text-ink-800/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Izdelek</th>
                  <th className="px-4 py-3 font-medium">Cena</th>
                  <th className="px-4 py-3 font-medium">Zaloga</th>
                  <th className="px-4 py-3 text-center font-medium">Najbolje prodajano</th>
                  <th className="px-4 py-3 text-center font-medium">Objavljeno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {visible.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/izdelki/${p.id}`} className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist-100">
                          {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 text-ink-300" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink-900 hover:underline">{p.name}</span>
                          <span className="block text-xs text-ink-800/50">{categories.find((c) => c.slug === p.category)?.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-900">
                      {p.salePrice !== undefined ? (
                        <>
                          <span className="font-medium text-red-600">{formatEur(p.salePrice)}</span>{' '}
                          <span className="text-xs text-ink-800/40 line-through">{formatEur(p.variants[0].price)}</span>
                        </>
                      ) : (
                        formatEur(p.variants[0].price)
                      )}
                      {p.variants.length > 1 && <span className="ml-1 text-xs text-ink-800/50">+{p.variants.length - 1} velikosti</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? 'font-medium text-red-600' : p.stock <= 3 ? 'font-medium text-amber-600' : 'text-ink-900'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => patch(p.id, { is_bestseller: !p.isBestseller })}
                        aria-label={p.isBestseller ? 'Odstrani iz najbolje prodajanih' : 'Dodaj med najbolje prodajane'}
                        className="rounded-md p-1.5 transition-colors hover:bg-brand-50"
                      >
                        <Star className={`h-4 w-4 ${p.isBestseller ? 'fill-brand-500 text-brand-500' : 'text-ink-200'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Toggle checked={p.isPublished} onChange={(v) => patch(p.id, { is_published: v })} label="Objavljeno" />
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-800/50">
                      Ni izdelkov, ki ustrezajo filtru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
