import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '@/context/StoreContext';
import { unitPrice, type Product } from '@/data/products';
import { callFunction } from '@/lib/supabase';

export interface CartLine {
  key: string;
  slug: string;
  size: string;
  qty: number;
  subscribe: boolean;
}

export interface ResolvedLine extends CartLine {
  product: Product;
  price: number;
  total: number;
}

const STORAGE_KEY = 'brandspot-cart';

interface CartContextValue {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  discount: number;
  discountCode: string | null;
  discountPercent: number;
  shipping: number;
  freeShippingThreshold: number;
  total: number;
  freeShippingLeft: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, size: string, qty?: number, subscribe?: boolean, openDrawer?: boolean) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyCode: (code: string) => Promise<boolean>;
  removeCode: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.key === 'string' && typeof l?.slug === 'string' && typeof l?.qty === 'number',
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>(loadLines);
  const [isOpen, setIsOpen] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
  const { getProduct, settings } = useStore();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLines));
  }, [rawLines]);

  const add = useCallback((slug: string, size: string, qty = 1, subscribe = false, openDrawer = true) => {
    const key = `${slug}|${size}|${subscribe ? 's' : 'o'}`;
    setRawLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
      return [...prev, { key, slug, size, qty, subscribe }];
    });
    if (openDrawer) setIsOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setRawLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => setRawLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => {
    setRawLines([]);
    setDiscount(null);
  }, []);

  const applyCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    const res = await callFunction<{ valid: boolean; percent?: number }>('store-query', {
      action: 'check_discount',
      code: normalized,
    }).catch(() => null);
    const percent = Number(res?.percent);
    if (!res?.valid || !Number.isFinite(percent) || percent <= 0) return false;
    setDiscount({ code: normalized, percent });
    return true;
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const lines = rawLines.flatMap((l) => {
      const product = getProduct(l.slug);
      if (!product) return [];
      const price = unitPrice(product, l.size, l.subscribe, settings.subscribe_discount);
      return [{ ...l, product, price, total: price * l.qty }];
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const threshold = settings.free_shipping_threshold;
    const discountAmount = discount ? Math.round(subtotal * discount.percent) / 100 : 0;
    const baseShipping = settings.shipping_methods.find((m) => m.enabled)?.price ?? 0;
    const shipping = subtotal === 0 || subtotal >= threshold ? 0 : baseShipping;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      discount: discountAmount,
      discountCode: discount?.code ?? null,
      discountPercent: discount?.percent ?? 0,
      shipping,
      freeShippingThreshold: threshold,
      total: subtotal - discountAmount + shipping,
      freeShippingLeft: Math.max(0, threshold - subtotal),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQty,
      remove,
      clear,
      applyCode,
      removeCode: () => setDiscount(null),
    };
  }, [rawLines, discount, isOpen, add, setQty, remove, clear, applyCode, getProduct, settings]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
