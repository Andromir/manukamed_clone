import { ArrowRight, ArrowUpRight, CreditCard, Headset, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import BestSellerCarousel from '@/components/home/BestSellerCarousel';
import { categoryIcons } from '@/components/shop/categoryIcons';
import BrandBall from '@/components/ui/BrandBall';
import Reveal from '@/components/ui/Reveal';
import { useContent, useStore } from '@/context/StoreContext';
import { categories } from '@/data/products';
import { formatPrice, pluralizeItems } from '@/lib/format';

const reasonIcons = [Truck, ShieldCheck, CreditCard, Headset];

export default function HomePage() {
  const home = useContent('home');
  const { bestSellers, products } = useStore();
  const featured = bestSellers[0] ?? products[0];

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="container-x relative grid min-h-[88vh] items-center gap-12 pb-20 pt-[132px] lg:grid-cols-2">
          <div>
            <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-brand-400" style={{ animationDelay: '0.1s' }}>
              {home.heroEyebrow}
            </p>
            <h1
              className="mt-6 animate-fade-up font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ animationDelay: '0.2s' }}
            >
              {home.heroTitleLine1}
              <br />
              {home.heroTitleLine2}
              <BrandBall className="ml-1 inline-block h-[0.24em] w-[0.24em] align-baseline" />
            </h1>
            <p className="mt-8 max-w-lg animate-fade-up text-base leading-relaxed text-ink-200 sm:text-lg" style={{ animationDelay: '0.3s' }}>
              {home.heroSubtitle}
            </p>
            <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4" style={{ animationDelay: '0.4s' }}>
              <Link to="/trgovina" className="btn-brand">
                {home.heroButton} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/kontakt" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-sm font-semibold transition-colors hover:border-white">
                Pomoč pri izbiri
              </Link>
            </div>
          </div>

          <div className="relative hidden h-full min-h-[520px] items-center justify-center lg:flex">
            {home.heroImage ? (
              <img src={home.heroImage} alt="" className="max-h-[620px] w-full animate-fade-in rounded-3xl object-cover" />
            ) : (
              <div className="relative">
                <BrandBall className="h-[420px] w-[420px] animate-scale-in drop-shadow-[0_40px_80px_rgba(228,34,4,0.35)]" />
                {featured && (
                  <Link
                    to={`/izdelek/${featured.slug}`}
                    className="group absolute -bottom-6 -left-16 flex w-80 animate-fade-up items-center gap-4 rounded-2xl bg-white p-3 text-ink-950 shadow-2xl transition-transform hover:-translate-y-1"
                    style={{ animationDelay: '0.6s' }}
                  >
                    <img src={featured.images[0]} alt="" className="h-20 w-16 shrink-0 rounded-xl bg-mist-100 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Izpostavljeno</span>
                      <span className="mt-1 block truncate text-sm font-semibold">{featured.name}</span>
                      <span className="text-sm text-ink-600">od {formatPrice(featured.salePrice ?? featured.variants[0].price)}</span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-400 transition-colors group-hover:text-brand-600" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24">
        <h2 className="heading-lg">{home.categoriesTitle}</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => {
            const Icon = categoryIcons[c.slug];
            const count = products.filter((p) => p.category === c.slug).length;
            return (
              <Reveal key={c.slug} delay={i * 60}>
                <Link
                  to={`/trgovina/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-mist-100 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-ink-950 hover:text-white"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-950 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="mt-8 font-display text-xl font-bold">{c.name}</span>
                  <span className="mt-1 text-sm text-ink-500 transition-colors group-hover:text-ink-300">{c.subtitle}</span>
                  <span className="mt-auto flex items-center justify-between pt-6 text-xs font-medium text-ink-500 group-hover:text-ink-300">
                    {pluralizeItems(count)}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-brand-400" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="pb-24">
          <div className="container-x mb-10 flex items-end justify-between">
            <h2 className="heading-lg">{home.bestsellersTitle}</h2>
            <Link to="/trgovina" className="link-underline hidden sm:inline-block">
              Vsi izdelki
            </Link>
          </div>
          <BestSellerCarousel items={bestSellers} />
        </section>
      )}

      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow">{home.reasonsEyebrow}</p>
            <h2 className="heading-lg mt-3">{home.reasonsTitle}</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {home.reasons.map((r, i) => {
              const Icon = reasonIcons[i % reasonIcons.length];
              return (
                <Reveal key={r.title} delay={i * 80} className="rounded-2xl bg-white p-8">
                  <Icon className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
                  <h3 className="heading-md mt-6">{r.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{r.content}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
