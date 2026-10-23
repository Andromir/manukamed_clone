import { Cable, Laptop, Router, Smartphone, Tv, type LucideIcon } from 'lucide-react';
import type { CategorySlug } from '@/data/products';

export const categoryIcons: Record<CategorySlug, LucideIcon> = {
  telefoni: Smartphone,
  racunalniki: Laptop,
  'tv-in-avdio': Tv,
  omrezje: Router,
  dodatki: Cable,
};
