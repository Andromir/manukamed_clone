export type OrderStatus = 'pending_payment' | 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface OrderItem {
  id: string;
  slug: string;
  name: string;
  size: string;
  image: string | null;
  qty: number;
  unit_price: number;
  total: number;
  subscribe: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string;
  address2: string | null;
  postal_code: string;
  city: string;
  country: string;
  shipping_label: string;
  shipping_cost: number;
  payment_fee: number;
  subtotal: number;
  discount: number;
  discount_code: string | null;
  total: number;
  newsletter: boolean;
  admin_note: string | null;
  created_at: string;
  order_items?: OrderItem[];
  invoice_number?: string | null;
  invoice_issued_at?: string | null;
  user_id?: string | null;
}

export const ORDER_STATUSES: { id: OrderStatus; label: string; tone: string }[] = [
  { id: 'new', label: 'Novo', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { id: 'processing', label: 'V obdelavi', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { id: 'shipped', label: 'Poslano', tone: 'bg-teal-50 text-teal-700 ring-teal-200' },
  { id: 'completed', label: 'Zaključeno', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { id: 'pending_payment', label: 'Čaka plačilo', tone: 'bg-gray-50 text-gray-600 ring-gray-200' },
  { id: 'cancelled', label: 'Preklicano', tone: 'bg-red-50 text-red-700 ring-red-200' },
];

export const PAYMENT_STATUSES: { id: PaymentStatus; label: string; tone: string }[] = [
  { id: 'unpaid', label: 'Neplačano', tone: 'bg-gray-50 text-gray-600 ring-gray-200' },
  { id: 'paid', label: 'Plačano', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { id: 'refunded', label: 'Vrnjeno', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { id: 'failed', label: 'Neuspešno', tone: 'bg-red-50 text-red-700 ring-red-200' },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Po povzetju',
  bank: 'Bančno nakazilo',
  stripe: 'Kartica (Stripe)',
  paypal: 'PayPal',
};

export const REVENUE_STATUSES: OrderStatus[] = ['new', 'processing', 'shipped', 'completed'];

export const orderStatus = (id: string) => ORDER_STATUSES.find((s) => s.id === id) ?? ORDER_STATUSES[0];
export const paymentStatus = (id: string) => PAYMENT_STATUSES.find((s) => s.id === id) ?? PAYMENT_STATUSES[0];

export const formatEur = (n: number) => new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' }).format(n);
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
