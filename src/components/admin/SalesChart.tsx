import { useState } from 'react';
import { formatEur } from '@/data/orders';
import type { DayPoint } from '@/lib/salesStats';

const shortDate = (iso: string) => new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short' }).format(new Date(iso));

export default function SalesChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const active = hover !== null ? data[hover] : null;
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div>
      <div className="mb-4 h-10 text-sm">
        {active ? (
          <>
            <p className="font-medium text-navy-900">{formatEur(active.revenue)}</p>
            <p className="text-xs text-navy-800/60">
              {shortDate(active.date)} · {active.orders} {active.orders === 1 ? 'naročilo' : 'naročil'}
            </p>
          </>
        ) : (
          <p className="text-xs text-navy-800/50">Premaknite miško čez stolpce za podrobnosti.</p>
        )}
      </div>
      <div className="flex h-48 items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div key={d.date} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${hover === i ? 'bg-gold-500' : d.revenue > 0 ? 'bg-navy-800' : 'bg-navy-100'}`}
              style={{ height: `${Math.max((d.revenue / max) * 100, 2)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10px] text-navy-800/50">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 truncate text-center">
            {i % labelEvery === 0 ? shortDate(d.date) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
