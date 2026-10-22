export type PaymentMethodId = 'cod' | 'bank' | 'stripe' | 'paypal';

export interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  price: number;
  enabled: boolean;
}

export interface PaymentMethod {
  enabled: boolean;
  label: string;
  fee: number;
  description: string;
}

export interface BankDetails {
  recipient: string;
  iban: string;
  bic: string;
  bank: string;
  purpose: string;
}

export interface StoreSettings {
  free_shipping_threshold: number;
  subscribe_discount: number;
  shipping_methods: ShippingMethod[];
  payment_methods: Record<PaymentMethodId, PaymentMethod>;
  bank_details: BankDetails;
  countries: string[];
  ga_measurement_id: string;
  store_email: string;
}

export const PAYMENT_METHOD_IDS: PaymentMethodId[] = ['cod', 'bank', 'stripe', 'paypal'];

export const defaultSettings: StoreSettings = {
  free_shipping_threshold: 50,
  subscribe_discount: 15,
  shipping_methods: [
    { id: 'posta', label: 'Pošta Slovenije', eta: '1–3 delovne dni', price: 3.9, enabled: true },
  ],
  payment_methods: {
    cod: { enabled: true, label: 'Plačilo po povzetju', fee: 1.5, description: '' },
    bank: { enabled: true, label: 'Bančno nakazilo (UPN)', fee: 0, description: '' },
    stripe: { enabled: false, label: 'Plačilna kartica', fee: 0, description: '' },
    paypal: { enabled: false, label: 'PayPal', fee: 0, description: '' },
  },
  bank_details: { recipient: '', iban: '', bic: '', bank: '', purpose: 'Plačilo naročila' },
  countries: ['Slovenija'],
  ga_measurement_id: '',
  store_email: 'info@manukamed.si',
};

export function normalizeSettings(row: Partial<StoreSettings> | null): StoreSettings {
  if (!row) return defaultSettings;
  return {
    free_shipping_threshold: Number(row.free_shipping_threshold ?? defaultSettings.free_shipping_threshold),
    subscribe_discount: Number(row.subscribe_discount ?? defaultSettings.subscribe_discount),
    shipping_methods: Array.isArray(row.shipping_methods)
      ? row.shipping_methods.map((m) => ({ ...m, price: Number(m.price) }))
      : defaultSettings.shipping_methods,
    payment_methods: { ...defaultSettings.payment_methods, ...(row.payment_methods ?? {}) },
    bank_details: { ...defaultSettings.bank_details, ...(row.bank_details ?? {}) },
    countries: Array.isArray(row.countries) && row.countries.length ? row.countries : defaultSettings.countries,
    ga_measurement_id: row.ga_measurement_id ?? '',
    store_email: row.store_email ?? defaultSettings.store_email,
  };
}
