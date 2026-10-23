import { categories } from '@/data/products';

export const shopLinks = categories.map((c) => ({ to: `/trgovina/${c.slug}`, label: c.name }));

export const supportLinks = [
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/pogosta-vprasanja', label: 'Pogosta vprašanja' },
  { to: '/pravno/dostava', label: 'Dostava' },
  { to: '/pravno/vracila', label: 'Vračila in garancija' },
  { to: '/pravno/pogoji-poslovanja', label: 'Pogoji poslovanja' },
  { to: '/pravno/zasebnost', label: 'Zasebnost' },
  { to: '/pravno/piskotki', label: 'Piškotki' },
];
