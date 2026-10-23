import type { ProductRow } from '@/data/products';

// Keep in sync with the seed in supabase/migrations/20261023060000_brandspot_rebrand.sql.
export const exampleProductRows: ProductRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'primer-pametni-telefon-nova-x1',
    name: 'Pametni telefon Nova X1',
    category: 'telefoni',
    badge: 'Primer',
    short: 'Primer izdelka: 6,1″ OLED zaslon, trojna 48 MP kamera in baterija za ves dan.',
    description:
      'To je primer izdelka, ki prikazuje, kako je izdelek predstavljen v trgovini Brandspot. V skrbniški plošči (Izdelki) ga uredite ali zamenjajte z resničnim izdelkom.',
    images: ['/images/products/primer-nova-x1-spredaj.svg', '/images/products/primer-nova-x1-zadaj.svg'],
    variants: [
      { size: '128 GB', price: 549 },
      { size: '256 GB', price: 629 },
      { size: '512 GB', price: 759 },
    ],
    sale_price: null,
    stock: 25,
    rating: 5,
    reviews: 0,
    how_to_use: '6,1″ OLED zaslon s 120 Hz osveževanjem, trojna 48 MP kamera z optično stabilizacijo, 5G in Wi-Fi 7, hitro polnjenje 45 W.',
    taste: 'Telefon, kabel USB-C na USB-C, orodje za odpiranje reže SIM, kratka navodila.',
    ingredients: 'Nano SIM in eSIM. Brezžično polnjenje Qi2. Deluje z ovitki in zaščitnimi stekli za Nova X1.',
    allergy: '2 leti garancije. Izdelek je izmišljen in služi le kot primer.',
    nutrition: [
      { label: 'Zaslon', value: '6,1″ OLED, 120 Hz' },
      { label: 'Procesor', value: 'Osemjedrni, 3,2 GHz' },
      { label: 'Delovni pomnilnik', value: '8 GB' },
      { label: 'Kamera', value: '48 + 12 + 12 MP' },
      { label: 'Baterija', value: '4.300 mAh' },
      { label: 'Teža', value: '172 g' },
    ],
    is_published: true,
    is_bestseller: true,
    sort_order: 0,
  },
];
