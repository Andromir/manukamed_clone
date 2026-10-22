import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: 'sm' | 'md';
}

export default function QuantityStepper({ value, onChange, min = 1, size = 'md' }: Props) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-12 w-12';
  return (
    <div className="inline-flex items-center border border-navy-100">
      <button
        type="button"
        aria-label="Zmanjšaj količino"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${box} flex items-center justify-center text-navy-700 transition-colors hover:bg-cream-100`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`${box} flex items-center justify-center border-x border-navy-100 text-sm font-normal`}>{value}</span>
      <button
        type="button"
        aria-label="Povečaj količino"
        onClick={() => onChange(Math.min(99, value + 1))}
        className={`${box} flex items-center justify-center text-navy-700 transition-colors hover:bg-cream-100`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
