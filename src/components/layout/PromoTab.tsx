import { Gift, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useContent } from '@/context/StoreContext';

export default function PromoTab() {
  const promo = useContent('promo');
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('promo-hidden') === '1');
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const hide = () => {
    sessionStorage.setItem('promo-hidden', '1');
    setHidden(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) setDone(true);
  };

  return (
    <>
      {!hidden && promo.enabled && (
        <div className="fixed bottom-6 left-0 z-30 flex animate-fade-up items-stretch shadow-xl" style={{ animationDelay: '1.5s' }}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-navy-900 py-3 pl-5 pr-4 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-gold-600"
          >
            <Gift className="h-4 w-4 text-gold-300" strokeWidth={1.5} />
            {promo.tabLabel}
          </button>
          <button type="button" onClick={hide} aria-label="Skrij" className="bg-navy-950 px-2.5 text-navy-200 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative grid w-full max-w-3xl animate-scale-in overflow-hidden bg-white md:grid-cols-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Zapri"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy-900 hover:rotate-90 hover:bg-white transition-transform"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={promo.image} alt="" className="hidden h-full w-full object-cover md:block" />
            <div className="p-10 md:p-12">
              <p className="eyebrow">{promo.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-normal uppercase tracking-[0.1em] text-navy-900">
                {promo.title} <span className="accent-serif block normal-case tracking-normal text-gold-600">{promo.titleAccent}</span>
              </h2>
              {done ? (
                <div className="mt-8 animate-scale-in">
                  <p className="text-sm text-navy-800/70">Vaša koda za popust:</p>
                  <p className="mt-3 border border-dashed border-gold-500 bg-gold-50 py-4 text-center text-lg font-medium tracking-[0.2em] text-navy-900">
                    {promo.code}
                  </p>
                  <p className="mt-3 text-xs text-navy-800/60">Vnesite jo v košarici ali na blagajni.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                  <p className="text-sm leading-relaxed text-navy-800/70">
                    {promo.text}
                  </p>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Vaš e-poštni naslov" className="input" />
                  <button type="submit" className="btn-primary w-full">
                    {promo.button}
                  </button>
                  <p className="text-[11px] leading-relaxed text-navy-800/50">S prijavo se strinjate s politiko zasebnosti. Odjava je mogoča kadarkoli.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
