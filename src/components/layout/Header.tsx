import { Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import MobileMenu from '@/components/layout/MobileMenu';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useCart } from '@/context/CartContext';
import { useContent } from '@/context/StoreContext';
import { shopLinks } from '@/components/layout/navigation';

export default function Header() {
  const { count, open } = useCart();
  const headerText = useContent('header');
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  const transparent = pathname === '/' && !scrolled;
  const navText = transparent ? 'text-white' : 'text-ink-900';

  return (
    <>
      {headerText.topBar && (
        <div className="relative z-40 bg-brand-600 px-4 py-2 text-center text-xs font-medium tracking-wide text-white">
          {headerText.topBar}
        </div>
      )}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          transparent ? 'bg-gradient-to-b from-ink-950/60 to-transparent' : 'bg-white/95 shadow-[0_1px_0_rgba(20,20,22,0.08)] backdrop-blur'
        } ${pathname === '/' ? '-mb-[76px]' : ''}`}
      >
        <div className="container-x flex h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Odpri meni" className={`lg:hidden ${navText}`}>
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <Logo light={transparent} />
            <nav className="hidden items-center gap-7 lg:flex">
              {[...shopLinks, { to: '/kontakt', label: 'Kontakt' }].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `relative py-2 text-sm font-medium transition-colors hover:text-brand-500 ${navText} ${
                      isActive ? 'after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-600' : ''
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className={`flex items-center gap-5 ${navText}`}>
            <span className="hidden text-xs font-medium tracking-[0.15em] xl:block">SI | EUR</span>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Iskanje" className="transition-colors hover:text-brand-500">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link to="/prijava" aria-label="Moj račun" className="hidden transition-colors hover:text-brand-500 sm:block">
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>
            <button type="button" onClick={open} aria-label="Košarica" className="relative transition-colors hover:text-brand-500">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {count > 0 && (
                <span
                  className={`absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-medium text-white transition-transform ${
                    bump ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
