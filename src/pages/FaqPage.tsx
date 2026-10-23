import { Link } from 'react-router-dom';
import Accordion from '@/components/ui/Accordion';
import { useContent } from '@/context/StoreContext';

export default function FaqPage() {
  const faqs = useContent('faq').items;
  return (
    <section className="container-x py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-center">Pomoč</p>
        <h1 className="heading-xl mt-4 text-center">Pogosta vprašanja</h1>
        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink-800/70">Vse, kar ste želeli vedeti o naročilih, dostavi, vračilih in garanciji.</p>
        <div className="mt-16">
          <Accordion items={faqs.map((f) => ({ title: f.q, content: f.a }))} />
        </div>
        <div className="mt-16 rounded-3xl bg-mist-100 p-10 text-center">
          <h2 className="heading-md">Niste našli odgovora?</h2>
          <p className="mt-3 text-sm text-ink-800/70">Pišite nam in z veseljem vam bomo pomagali.</p>
          <Link to="/kontakt" className="btn-primary mt-6">
            Kontaktirajte nas
          </Link>
        </div>
      </div>
    </section>
  );
}
