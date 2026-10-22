import { Link } from 'react-router-dom';
import Accordion from '@/components/ui/Accordion';
import { useContent } from '@/context/StoreContext';

export default function FaqSection({ limit = 7 }: { limit?: number }) {
  const faqs = useContent('faq').items;
  return (
    <section className="bg-navy-900 py-20 text-white sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs font-medium uppercase tracking-widest2 text-gold-400">Pogosta vprašanja</p>
          <h2 className="mt-4 text-3xl font-normal uppercase tracking-[0.12em] sm:text-4xl">
            Zakaj <span className="accent-serif normal-case tracking-normal text-gold-300">manuka</span> med?
          </h2>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-navy-100/70">
            Visoko kakovosten, pristen manuka med, preizkušen in certificiran na Novi Zelandiji.
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
