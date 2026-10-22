export default function PageHero({ image, eyebrow, title, lead }: { image: string; eyebrow: string; title: string; lead?: string }) {
  return (
    <section className="relative flex h-[56vh] min-h-[420px] items-end overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/40 to-navy-950/10" />
      <div className="container-x relative pb-16 text-white sm:pb-20">
        <p className="animate-fade-up text-xs font-medium uppercase tracking-widest2 text-gold-300">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl animate-fade-up text-4xl font-normal uppercase leading-tight tracking-[0.12em] sm:text-6xl" style={{ animationDelay: '0.1s' }}>
          {title}
        </h1>
        {lead && (
          <p className="accent-serif mt-6 max-w-2xl animate-fade-up text-xl text-white/90 sm:text-2xl" style={{ animationDelay: '0.2s' }}>
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
