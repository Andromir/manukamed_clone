import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import PageHero from '@/components/sections/PageHero';
import { useContent } from '@/context/StoreContext';

export default function ContactPage() {
  const contact = useContent('contact');
  const info = [
    { Icon: Mail, title: 'E-pošta', text: contact.email },
    { Icon: Phone, title: 'Telefon', text: contact.phone },
    { Icon: MapPin, title: 'Naslov', text: contact.address },
    { Icon: Clock, title: 'Delovni čas', text: contact.hours },
  ].filter((i) => i.text);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <PageHero eyebrow={contact.eyebrow} title={contact.title} lead={contact.lead} />
      <section className="container-x grid gap-16 py-20 sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="heading-lg">Kontaktni podatki</h2>
          <ul className="mt-10 space-y-8">
            {info.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mist-100">
                  <Icon className="h-5 w-5 text-brand-600" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block text-xs font-medium uppercase tracking-[0.16em] text-ink-900">{title}</span>
                  <span className="mt-1 block text-sm text-ink-800/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {sent ? (
            <div className="flex h-full animate-scale-in flex-col items-center justify-center rounded-3xl bg-mist-100 p-12 text-center">
              <Send className="h-10 w-10 text-brand-600" strokeWidth={1.25} />
              <h3 className="heading-md mt-6">Hvala za vaše sporočilo</h3>
              <p className="mt-3 text-sm text-ink-800/70">Odgovorili vam bomo v enem delovnem dnevu.</p>
              <button type="button" onClick={() => setSent(false)} className="btn-outline mt-8">
                Novo sporočilo
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-ink-800">Ime in priimek</span>
                <input required className="input" autoComplete="name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-ink-800">E-pošta</span>
                <input required type="email" className="input" autoComplete="email" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-ink-800">Zadeva</span>
                <select className="input">
                  <option>Splošno vprašanje</option>
                  <option>Vprašanje o naročilu</option>
                  <option>Svetovanje pri izbiri izdelka</option>
                  <option>Garancija in reklamacije</option>
                  <option>Poslovno sodelovanje</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-ink-800">Sporočilo</span>
                <textarea required rows={6} className="input resize-none" />
              </label>
              <label className="flex items-start gap-3 text-sm text-ink-800 sm:col-span-2">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-ink-900" />
                Strinjam se z obdelavo osebnih podatkov za namen odgovora na sporočilo.
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Pošlji sporočilo
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
