import { ArrowRight, Facebook, Instagram, Mail, Phone, Youtube } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { useContent, useStore } from '@/context/StoreContext';
import { PAYMENT_METHOD_IDS } from '@/data/settings';
import { openCookieSettings } from '@/lib/analytics';
import { shopLinks, supportLinks } from '@/components/layout/navigation';

export default function Footer() {
  const footer = useContent('footer');
  const contact = useContent('contact');
  const { settings } = useStore();
  const paymentBadges = PAYMENT_METHOD_IDS.filter((id) => settings.payment_methods[id]?.enabled).map((id) => settings.payment_methods[id].label);
  const socials = [
    { Icon: Instagram, label: 'Instagram', href: footer.instagram },
    { Icon: Facebook, label: 'Facebook', href: footer.facebook },
    { Icon: Youtube, label: 'YouTube', href: footer.youtube },
  ].filter((s) => /^https?:\/\//i.test(s.href));
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubscribed(true);
  };

  const columns = [
    { title: 'Trgovina', links: [{ to: '/trgovina', label: 'Vsi izdelki' }, ...shopLinks, { to: '/prijava', label: 'Moj račun' }] },
    { title: 'Pomoč', links: supportLinks },
  ];
  const contactLines = [
    { Icon: Mail, text: contact.email, href: `mailto:${contact.email}` },
    { Icon: Phone, text: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` },
  ].filter((c) => c.text);

  return (
    <footer className="bg-ink-950 text-white">
      <div className="container-x grid gap-16 py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Logo light size="lg" />
          <div className="mt-14 grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm text-ink-100/80 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {contactLines.length > 0 && (
              <div>
                <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">Kontakt</h3>
                <ul className="space-y-3">
                  {contactLines.map(({ Icon, text, href }) => (
                    <li key={text}>
                      <a href={href} className="flex items-center gap-2 text-sm text-ink-100/80 transition-colors hover:text-white">
                        <Icon className="h-4 w-4 shrink-0 text-brand-400" strokeWidth={1.75} /> {text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <h3 className="font-display text-2xl font-bold">{footer.newsletterTitle}</h3>
          <p className="mt-4 text-sm leading-relaxed text-ink-100/70">
            {footer.newsletterText}
          </p>
          {subscribed ? (
            <div className="mt-8 animate-scale-in border border-brand-500/40 bg-brand-500/10 p-5 text-sm text-brand-100">
              Hvala za prijavo! Vaša koda za popust: <strong className="font-medium text-white">{footer.newsletterCode}</strong>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8">
              <label htmlFor="footer-email" className="mb-2 block text-xs uppercase tracking-[0.16em] text-ink-100/70">
                Vaš e-poštni naslov
              </label>
              <div className="flex overflow-hidden rounded-full border border-white/25 transition-colors focus-within:border-brand-400">
                <Mail className="ml-4 h-4 w-4 self-center text-ink-200" strokeWidth={1.5} />
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ime@primer.si"
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-white placeholder:text-ink-300 focus:outline-none"
                />
                <button type="submit" aria-label="Prijava na e-novice" className="bg-brand-600 px-5 text-white transition-colors hover:bg-brand-500">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
          {socials.length > 0 && (
          <div className="mt-10 flex gap-3">
            {socials.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-400"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
          <div className="flex flex-wrap justify-center gap-2">
            {paymentBadges.map((b) => (
              <span key={b} className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink-100">
                {b}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-100/60">
            <p>© {new Date().getFullYear()} {footer.copyright}</p>
            {settings.ga_measurement_id && (
              <button type="button" onClick={openCookieSettings} className="underline-offset-2 transition-colors hover:text-white hover:underline">
                Nastavitve piškotkov
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
