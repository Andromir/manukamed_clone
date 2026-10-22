import { ChevronDown, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import MobileMenu from '@/components/layout/MobileMenu';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useCart } from '@/context/CartContext';
import { useContent } from '@/context/StoreContext';
import { learnLinks, shopLinks } from '@/components/layout/navigation';

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
  const navText = transparent ? 'text-white' : 'text-navy-900';

  return (
    <>
      {headerText.topBar && (
        <div className="relative z-40 bg-navy-950 px-4 py-2.5 text-center text-[11px] font-normal uppercase tracking-[0.2em] text-gold-200">
          {headerText.topBar}
        </div>
      )}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          transparent ? 'bg-gradient-to-b from-navy-950/60 to-transparent' : 'bg-white/95 shadow-[0_1px_0_rgba(15,29,60,0.08)] backdrop-blur'
        } ${pathname === '/' ? '-mb-[76px]' : ''}`}
      >
        <div className="container-x flex h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Odpri meni" className={`lg:hidden ${navText}`}>
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <Logo light={transparent} />
            <nav className="hidden items-center gap-8 lg:flex">
              {shopLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `relative py-2 text-xs font-normal uppercase tracking-[0.2em] transition-colors hover:text-gold-500 ${navText} ${
                      isActive ? 'after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:bg-gold-500' : ''
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="group relative">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 py-2 text-xs font-normal uppercase tracking-[0.2em] transition-colors hover:text-gold-500 ${navText}`}
                >
                  Spoznajte <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-full w-[520px] -translate-x-1/2 pt-4 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="grid grid-cols-2 gap-1 bg-white p-6 shadow-2xl shadow-navy-950/10">
                    {learnLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="group/item px-4 py-3 transition-colors hover:bg-cream-100"
                      >
                        <span className="block text-xs font-medium uppercase tracking-[0.16em] text-navy-900 group-hover/item:text-gold-600">
                          {link.label}
                        </span>
                        <span className="mt-1 block text-xs text-navy-800/60">{link.hint}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <NavLink to="/kontakt" className={`py-2 text-xs font-normal uppercase tracking-[0.2em] transition-colors hover:text-gold-500 ${navText}`}>
                Kontakt
              </NavLink>
            </nav>
          </div>

          <div className={`flex items-center gap-5 ${navText}`}>
            <span className="hidden text-xs font-normal tracking-[0.15em] xl:block">SI | EUR</span>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Iskanje" className="transition-colors hover:text-gold-500">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link to="/prijava" aria-label="Moj račun" className="hidden transition-colors hover:text-gold-500 sm:block">
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>
            <button type="button" onClick={open} aria-label="Košarica" className="relative transition-colors hover:text-gold-500">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {count > 0 && (
                <span
                  className={`absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-medium text-white transition-transform ${
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
