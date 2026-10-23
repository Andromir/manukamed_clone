import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { contentDefaults, type ContentDefaults, type ContentKey } from '@/content/defaults';
import { exampleProductRows } from '@/data/exampleProducts';
import { mapProduct, type Product, type ProductRow } from '@/data/products';
import { defaultSettings, normalizeSettings, type StoreSettings } from '@/data/settings';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface StoreContextValue {
  products: Product[];
  bestSellers: Product[];
  settings: StoreSettings;
  content: Partial<Record<ContentKey, unknown>>;
  loading: boolean;
  error: string | null;
  getProduct: (slug: string | undefined) => Product | undefined;
  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [content, setContent] = useState<Partial<Record<ContentKey, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setProducts(exampleProductRows.map(mapProduct));
      setLoading(false);
      return;
    }
    const [p, s, c] = await Promise.all([
      supabase.from('products').select('*').eq('is_published', true).order('sort_order').order('name'),
      supabase.from('store_settings').select('*').maybeSingle(),
      supabase.from('site_content').select('key, value'),
    ]);
    if (p.error) setError('Izdelkov trenutno ni mogoče naložiti. Poskusite znova čez nekaj trenutkov.');
    else {
      setError(null);
      setProducts((p.data as ProductRow[]).map(mapProduct));
    }
    if (!s.error) setSettings(normalizeSettings(s.data as Partial<StoreSettings> | null));
    if (!c.error && c.data) {
      setContent(Object.fromEntries(c.data.map((r) => [r.key, r.value])) as Partial<Record<ContentKey, unknown>>);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<StoreContextValue>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return {
      products,
      bestSellers: products.filter((p) => p.isBestseller),
      settings,
      content,
      loading,
      error,
      getProduct: (slug) => (slug ? bySlug.get(slug) : undefined),
      reload,
    };
  }, [products, settings, content, loading, error, reload]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContent<K extends ContentKey>(key: K): ContentDefaults[K] {
  const { content } = useStore();
  const saved = content[key];
  return useMemo(() => {
    const defaults = contentDefaults[key];
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults;
    return { ...defaults, ...(saved as Partial<ContentDefaults[K]>) };
  }, [key, saved]);
}
