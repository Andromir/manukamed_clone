import { ArrowRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { shopLinks, supportLinks } from '@/components/layout/navigation';

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-slide-in-left flex-col bg-white">
        <div className="flex h-[76px] items-center justify-between border-b border-ink-100 px-6">
          <div onClick={onClose}>
            <Logo />
          </div>
          <button type="button" onClick={onClose} aria-label="Zapri meni" className="text-ink-900">
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 py-8">
          <p className="eyebrow mb-4">Trgovina</p>
          {[{ to: '/trgovina', label: 'Vsi izdelki' }, ...shopLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className="flex items-center justify-between border-b border-ink-100 py-4 text-base font-medium text-ink-900"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
            </Link>
          ))}
          <p className="eyebrow mb-4 mt-10">Pomoč</p>
          {supportLinks.slice(0, 4).map((link) => (
            <Link key={link.to} to={link.to} onClick={onClose} className="block py-2.5 text-sm text-ink-800">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-ink-100 p-6">
          <Link to="/prijava" onClick={onClose} className="btn-primary w-full">
            Prijava / Registracija
          </Link>
        </div>
      </aside>
    </div>
  );
}
