import BrandBall from '@/components/ui/BrandBall';

export default function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <BrandBall className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 sm:h-[26rem] sm:w-[26rem]" />
      <div className="container-x relative py-16 sm:py-24">
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-6xl" style={{ animationDelay: '0.1s' }}>
          {title}
        </h1>
        {lead && (
          <p className="mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-ink-200 sm:text-lg" style={{ animationDelay: '0.2s' }}>
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
