import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/ui/Reveal';

interface Props {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  link?: { to: string; label: string };
  reverse?: boolean;
  overlay?: ReactNode;
  tone?: 'white' | 'cream' | 'navy';
}

const tones = {
  white: 'bg-white',
  cream: 'bg-cream-100',
  navy: 'bg-navy-900 text-white',
};

export default function SplitFeature({ image, imageAlt, eyebrow, title, children, link, reverse, overlay, tone = 'white' }: Props) {
  const dark = tone === 'navy';
  return (
    <section className={`grid lg:grid-cols-2 ${tones[tone]}`}>
      <div className={`group relative min-h-[360px] overflow-hidden sm:min-h-[480px] lg:min-h-[620px] ${reverse ? 'lg:order-2' : ''}`}>
        <img src={image} alt={imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105" />
        {overlay && <div className="absolute inset-0 flex items-center justify-center bg-navy-950/30 p-8">{overlay}</div>}
      </div>
      <div className="flex items-center px-6 py-16 sm:px-16 lg:px-20">
        <Reveal className="max-w-md">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className={`mt-4 text-2xl font-normal uppercase tracking-[0.12em] sm:text-3xl ${dark ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
          <div className={`mt-6 space-y-4 text-sm leading-relaxed ${dark ? 'text-navy-100/80' : 'text-navy-800/75'}`}>{children}</div>
          {link && (
            <Link to={link.to} className={`link-underline mt-8 ${dark ? '!text-gold-300' : ''}`}>
              {link.label}
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
