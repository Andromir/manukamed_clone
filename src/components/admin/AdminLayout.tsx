import { BarChart3, ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LoadingBlock } from '@/components/admin/ui';
import Logo from '@/components/ui/Logo';
import { useAdminAuth } from '@/context/AdminAuthContext';

const nav = [
  { to: '/admin', label: 'Pregled', Icon: LayoutDashboard, end: true },
  { to: '/admin/narocila', label: 'Naročila', Icon: ShoppingCart },
  { to: '/admin/uporabniki', label: 'Uporabniki', Icon: Users },
  { to: '/admin/izdelki', label: 'Izdelki', Icon: Package },
  { to: '/admin/analitika', label: 'Analitika', Icon: BarChart3 },
  { to: '/admin/nastavitve', label: 'Nastavitve', Icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { session, signOut } = useAdminAuth();
  return (
    <div className="flex h-full flex-col bg-ink-950 text-white">
      <div className="px-6 py-6">
        <Logo light />
        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-brand-300">Skrbništvo</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? 'bg-white/10 font-medium text-white' : 'text-ink-100/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link to="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-100/70 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} /> Ogled trgovine
        </Link>
        <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-100/70 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> Odjava
        </button>
        <p className="truncate px-3 pt-2 text-xs text-ink-300">{session?.user.email}</p>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { session, isAdmin, loading } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (loading) return <LoadingBlock />;
  if (!session || !isAdmin) return <Navigate to="/admin/prijava" replace />;

  return (
    <div className="min-h-screen bg-mist-100 font-normal">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Odpri meni" className="rounded-lg p-2 text-ink-900 hover:bg-ink-50">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-in">
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Zapri meni" className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="px-4 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
