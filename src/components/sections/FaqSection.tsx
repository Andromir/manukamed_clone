import { Link } from 'react-router-dom';
import Accordion from '@/components/ui/Accordion';
import { useContent } from '@/context/StoreContext';

export default function FaqSection({ limit = 7 }: { limit?: number }) {
  const faqs = useContent('faq').items;
  return (
    <section className="bg-ink-950 py-20 text-white sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">Pogosta vprašanja</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Imate vprašanje?</h2>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-100/70">
            Odgovori o dostavi, plačilu, vračilih in garanciji na enem mestu.
          </p>
          <Link to="/pogosta-vprasanja" className="btn-light mt-10">
            Vsa vprašanja
          </Link>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <Accordion dark items={faqs.slice(0, limit).map((f) => ({ title: f.q, content: f.a }))} />
        </div>
      </div>
    </section>
  );
}
