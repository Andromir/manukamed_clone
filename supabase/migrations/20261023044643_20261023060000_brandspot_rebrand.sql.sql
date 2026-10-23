/*
# Brandspot rebrand

1. Defaults
- New products default to the `dodatki` category (the old `ostali-izdelki` category no longer exists).
- The store contact email defaults to info@brandspot.si; a store row still on the donor
  address is switched over.

2. Example product
- Seeds one published example product (`primer-pametni-telefon-nova-x1`) so the storefront
  is not empty. It is skipped if a product with that slug already exists and can be edited
  or deleted in the admin dashboard like any other product.
- Mirrors `src/data/exampleProducts.ts`, which the storefront uses when Supabase is not configured.
*/

ALTER TABLE products ALTER COLUMN category SET DEFAULT 'dodatki';

ALTER TABLE store_settings ALTER COLUMN store_email SET DEFAULT 'info@brandspot.si';
UPDATE store_settings SET store_email = 'info@brandspot.si' WHERE store_email = 'info@manukamed.si';

INSERT INTO products (
  slug, name, category, badge, short, description, images, variants, sale_price, stock, rating, reviews,
  how_to_use, taste, ingredients, allergy, nutrition, is_published, is_bestseller, sort_order
) VALUES (
  'primer-pametni-telefon-nova-x1',
  'Pametni telefon Nova X1',
  'telefoni',
  'Primer',
  'Primer izdelka: 6,1″ OLED zaslon, trojna 48 MP kamera in baterija za ves dan.',
  'To je primer izdelka, ki prikazuje, kako je izdelek predstavljen v trgovini Brandspot. V skrbniški plošči (Izdelki) ga uredite ali zamenjajte z resničnim izdelkom.',
  '["/images/products/primer-nova-x1-spredaj.svg", "/images/products/primer-nova-x1-zadaj.svg"]'::jsonb,
  '[{"size": "128 GB", "price": 549}, {"size": "256 GB", "price": 629}, {"size": "512 GB", "price": 759}]'::jsonb,
  NULL,
  25,
  5,
  0,
  '6,1″ OLED zaslon s 120 Hz osveževanjem, trojna 48 MP kamera z optično stabilizacijo, 5G in Wi-Fi 7, hitro polnjenje 45 W.',
  'Telefon, kabel USB-C na USB-C, orodje za odpiranje reže SIM, kratka navodila.',
  'Nano SIM in eSIM. Brezžično polnjenje Qi2. Deluje z ovitki in zaščitnimi stekli za Nova X1.',
  '2 leti garancije. Izdelek je izmišljen in služi le kot primer.',
  '[{"label": "Zaslon", "value": "6,1″ OLED, 120 Hz"}, {"label": "Procesor", "value": "Osemjedrni, 3,2 GHz"}, {"label": "Delovni pomnilnik", "value": "8 GB"}, {"label": "Kamera", "value": "48 + 12 + 12 MP"}, {"label": "Baterija", "value": "4.300 mAh"}, {"label": "Teža", "value": "172 g"}]'::jsonb,
  true,
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;