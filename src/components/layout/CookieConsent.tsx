import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { getConsent, loadAnalytics, onOpenCookieSettings, setConsent, type Consent } from '@/lib/analytics';

export default function CookieConsent() {
  const { settings } = useStore();
  const { pathname } = useLocation();
  const gaId = settings.ga_measurement_id;
  const [consent, setConsentState] = useState<Consent | null>(() => getConsent());
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenCookieSettings(() => setOpen(true)), []);

  useEffect(() => {
    if (gaId && consent === 'granted' && !pathname.startsWith('/admin')) loadAnalytics(gaId);
  }, [gaId, consent, pathname]);

  if (!gaId || pathname.startsWith('/admin')) return null;
  if (consent && !open) return null;

  const choose = (value: Consent) => {
    setConsent(value);
    setConsentState(value);
    setOpen(false);
    if (value === 'denied' && window.gtag) window.location.reload();
  };

  return (
    <div role="dialog" aria-label="Piškotki" className="fixed inset-x-4 bottom-4 z-[60] animate-fade-up sm:left-auto sm:right-6 sm:max-w-md">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Cookie className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-ink-900">Piškotki</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-800/70">
              Z vašim dovoljenjem uporabljamo analitične piškotke, ki nam pomagajo izboljšati trgovino. Nujni piškotki za delovanje košarice so vedno vključeni.{' '}
              <Link to="/pravno/zasebnost" className="underline hover:text-ink-900">
                Več o zasebnosti
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => choose('denied')} className="flex-1 rounded-full border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-50">
            Samo nujni
          </button>
          <button type="button" onClick={() => choose('granted')} className="flex-1 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-700">
            Sprejmi vse
          </button>
        </div>
      </div>
    </div>
  );
}
