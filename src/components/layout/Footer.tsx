import { ArrowRight, Facebook, Instagram, Mail, Youtube } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { useContent, useStore } from '@/context/StoreContext';
import { PAYMENT_METHOD_IDS } from '@/data/settings';
import { openCookieSettings } from '@/lib/analytics';
import { learnLinks, shopLinks, supportLinks } from '@/components/layout/navigation';

export default function Footer() {
  const footer = useContent('footer');
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
    { title: 'Spoznajte', links: learnLinks.slice(0, 5) },
    { title: 'Pomoč', links: supportLinks },
  ];

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-x grid gap-16 py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Logo light stacked />
          <div className="mt-14 grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-5 text-xs font-medium uppercase tracking-widest2 text-gold-400">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-xs uppercase tracking-[0.14em] text-navy-100/80 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <h3 className="text-xl font-normal uppercase tracking-[0.18em]">{footer.newsletterTitle}</h3>
          <p className="mt-4 text-sm leading-relaxed text-navy-100/70">
            {footer.newsletterText}
          </p>
          {subscribed ? (
            <div className="mt-8 animate-scale-in border border-gold-500/40 bg-gold-500/10 p-5 text-sm text-gold-100">
              Hvala za prijavo! Vaša koda za popust: <strong className="font-medium text-white">{footer.newsletterCode}</strong>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8">
              <label htmlFor="footer-email" className="mb-2 block text-xs uppercase tracking-[0.16em] text-navy-100/70">
                Vaš e-poštni naslov
              </label>
              <div className="flex border border-white/25 transition-colors focus-within:border-gold-400">
                <Mail className="ml-4 h-4 w-4 self-center text-navy-200" strokeWidth={1.5} />
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ime@primer.si"
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-white placeholder:text-navy-300 focus:outline-none"
                />
                <button type="submit" aria-label="Prijava na e-novice" className="bg-white px-5 text-navy-950 transition-colors hover:bg-gold-500 hover:text-white">
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-all hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-400"
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
              <span key={b} className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wide text-navy-100">
                {b}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-navy-100/60">
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
