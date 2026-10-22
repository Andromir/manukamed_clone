import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CartDrawer from '@/components/layout/CartDrawer';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import PromoTab from '@/components/layout/PromoTab';

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <PromoTab />
    </div>
  );
}
