export type CategorySlug = 'telefoni' | 'racunalniki' | 'tv-in-avdio' | 'omrezje' | 'dodatki';

export interface Category {
  slug: CategorySlug;
  name: string;
  title: string;
  subtitle: string;
  intro: string;
}

export interface ProductVariant {
  size: string;
  price: number;
}

export interface NutritionRow {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  badge?: string;
  short: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviews: number;
  howToUse: string;
  taste: string;
  ingredients: string;
  allergy: string;
  nutrition?: NutritionRow[];
  stock: number;
  salePrice?: number;
  id: string;
  isPublished: boolean;
  isBestseller: boolean;
  sortOrder: number;
}

export const categories: Category[] = [
  {
    slug: 'telefoni',
    name: 'Telefoni',
    title: 'Telefoni',
    subtitle: 'Pametni telefoni in nosljive naprave',
    intro: 'Najnovejši pametni telefoni, pametne ure in brezžične slušalke vodilnih proizvajalcev.',
  },
  {
    slug: 'racunalniki',
    name: 'Računalniki',
    title: 'Računalniki in tablice',
    subtitle: 'Prenosniki, tablice in periferija',
    intro: 'Prenosni računalniki, tablice, miške in tipkovnice za delo, šolo in igranje.',
  },
  {
    slug: 'tv-in-avdio',
    name: 'TV in avdio',
    title: 'TV in avdio',
    subtitle: 'Televizorji, zvočniki in pretočne naprave',
    intro: 'Pametni televizorji, pretočne naprave, zvočniki in slušalke za domačo zabavo.',
  },
  {
    slug: 'omrezje',
    name: 'Omrežje',
    title: 'Omrežje in pametni dom',
    subtitle: 'Wi-Fi, mesh sistemi in pametni dom',
    intro: 'Usmerjevalniki, mesh sistemi in pametne naprave za hitro in zanesljivo povezavo v vsakem kotu doma.',
  },
  {
    slug: 'dodatki',
    name: 'Dodatki',
    title: 'Dodatki',
    subtitle: 'Polnilci, kabli in zaščita',
    intro: 'Polnilci, kabli, ovitki in drugi dodatki, ki vašim napravam pomagajo dati največ.',
  },
];

// Product columns keep their original database names; these are their storefront meanings.
export const productDetailLabels = {
  howToUse: 'Ključne lastnosti',
  taste: 'Vsebina paketa',
  ingredients: 'Združljivost',
  allergy: 'Garancija in opozorila',
  nutrition: 'Tehnične specifikacije',
} as const;

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  badge: string | null;
  short: string;
  description: string;
  images: string[] | null;
  variants: ProductVariant[] | null;
  sale_price: number | string | null;
  stock: number;
  rating: number | string;
  reviews: number;
  how_to_use: string;
  taste: string;
  ingredients: string;
  allergy: string;
  nutrition: NutritionRow[] | null;
  is_published: boolean;
  is_bestseller: boolean;
  sort_order: number;
}

export function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    badge: r.badge || undefined,
    short: r.short ?? '',
    description: r.description ?? '',
    images: Array.isArray(r.images) ? r.images : [],
    variants: Array.isArray(r.variants) && r.variants.length ? r.variants.map((v) => ({ size: v.size, price: Number(v.price) })) : [{ size: '', price: 0 }],
    salePrice: r.sale_price === null || r.sale_price === '' ? undefined : Number(r.sale_price),
    stock: r.stock ?? 0,
    rating: Number(r.rating ?? 5),
    reviews: r.reviews ?? 0,
    howToUse: r.how_to_use ?? '',
    taste: r.taste ?? '',
    ingredients: r.ingredients ?? '',
    allergy: r.allergy ?? '',
    nutrition: Array.isArray(r.nutrition) && r.nutrition.length ? r.nutrition : undefined,
    isPublished: r.is_published,
    isBestseller: r.is_bestseller,
    sortOrder: r.sort_order ?? 0,
  };
}

export function getCategory(slug: string | undefined) {
  return categories.find((c) => c.slug === slug);
}

export function getVariant(product: Product, size: string) {
  return product.variants.find((v) => v.size === size) ?? product.variants[0];
}

export function unitPrice(product: Product, size: string, subscribe: boolean, subscribePercent: number) {
  const base = product.salePrice ?? getVariant(product, size).price;
  return subscribe ? Math.round(base * (1 - subscribePercent / 100) * 100) / 100 : base;
}
