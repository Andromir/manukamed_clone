# Brandspot webstore

Storefront for [brandspot.si](https://brandspot.si): React + Vite + Tailwind CSS, with the custom CMS (admin dashboard at `/admin`) backed by Supabase.

## Development

```bash
npm ci
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (e.g. in `.env`) to connect to the database. Without them the storefront starts in preview mode with the example product from `src/data/exampleProducts.ts`.

## Brand

- Logo: `public/brand/brandspot-logo.png` (light backgrounds) and `public/brand/brandspot-logo-white.png` (dark backgrounds); icon: `public/favicon.svg`.
- Colors (`tailwind.config.js`): `brand` (logo red, `brand-600` = `#e42204`), `ink` (graphite for text and dark surfaces), `mist` (light neutral surfaces).
- Fonts: League Spartan for headings (`font-display`) and Inter for body text (`font-sans`).
