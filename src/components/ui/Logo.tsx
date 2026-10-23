import { Link } from 'react-router-dom';

export default function Logo({ light = false, size = 'md' }: { light?: boolean; size?: 'md' | 'lg' }) {
  return (
    <Link to="/" aria-label="Brandspot – domov" className="group inline-flex shrink-0 items-center">
      <img
        src={light ? '/brand/brandspot-logo-white.png' : '/brand/brandspot-logo.png'}
        alt="Brandspot"
        width={606}
        height={197}
        className={`w-auto transition-transform duration-300 group-hover:-translate-y-px ${size === 'lg' ? 'h-14' : 'h-8 sm:h-9'}`}
      />
    </Link>
  );
}
