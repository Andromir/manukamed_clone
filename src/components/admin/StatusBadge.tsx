import { orderStatus, paymentStatus } from '@/data/orders';

export function OrderStatusBadge({ status }: { status: string }) {
  const s = orderStatus(status);
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.tone}`}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const s = paymentStatus(status);
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.tone}`}>{s.label}</span>;
}
