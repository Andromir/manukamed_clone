import { Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ light = false, stacked = false }: { light?: boolean; stacked?: boolean }) {
  const text = light ? 'text-white' : 'text-navy-900';
  return (
    <Link
      to="/"
      aria-label="ManukaMed – domov"
      className={`group flex items-center gap-2.5 ${stacked ? 'flex-col items-start gap-3' : ''}`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center">
        <Hexagon className="absolute h-9 w-9 text-gold-500 transition-transform duration-700 group-hover:rotate-[30deg]" strokeWidth={1.25} />
        <Hexagon className="h-4 w-4 fill-gold-500 text-gold-500" strokeWidth={1} />
      </span>
      <span className={`leading-none ${text}`}>
        <span className={`block font-serif italic ${stacked ? 'text-4xl' : 'text-2xl'}`}>
          Manuka<span className="text-gold-500">Med</span>
        </span>
        {stacked && <span className="mt-2 block text-[10px] font-medium uppercase tracking-widest2 text-gold-400">Nova Zelandija</span>}
      </span>
    </Link>
  );
}
