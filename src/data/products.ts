export type CategorySlug = 'manuka-med' | 'ostali-izdelki';

export interface Category {
  slug: CategorySlug;
  name: string;
  title: string;
  subtitle: string;
  intro: string;
  heroImage: string;
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
  mgo?: number;
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
    slug: 'manuka-med',
    name: 'Manuka med',
    title: 'Pristen manuka med',
    subtitle: 'Notranja in zunanja vitalnost',
    intro:
      'Certificiran MGO™ manuka med iz Nove Zelandije. Vsaka serija je testirana, da vsebuje toliko metilglioksala, kot je navedeno na etiketi.',
    heroImage: 'https://images.pexels.com/photos/4921856/pexels-photo-4921856.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'ostali-izdelki',
    name: 'Ostali izdelki',
    title: 'Ostali izdelki',
    subtitle: 'Propolis, kozmetika, dodatki in nega',
    intro:
      'Propolis, pastile, kozmetika z manuka medom, prehranska dopolnila in drugi naravni izdelki iz Nove Zelandije in beyond.',
    heroImage: 'https://images.pexels.com/photos/8101134/pexels-photo-8101134.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  mgo: number | null;
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
    mgo: r.mgo ?? undefined,
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
