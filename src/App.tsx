import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import PageLoader from '@/components/ui/PageLoader';
import CookieConsent from '@/components/layout/CookieConsent';
import Layout from '@/components/layout/Layout';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { CartProvider } from '@/context/CartContext';
import { StoreProvider } from '@/context/StoreContext';
import AccountPage from '@/pages/AccountPage';
import CheckoutPage from '@/pages/CheckoutPage';
import ContactPage from '@/pages/ContactPage';
import FaqPage from '@/pages/FaqPage';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import PolicyPage from '@/pages/PolicyPage';
import ProductPage from '@/pages/ProductPage';
import ShopPage from '@/pages/ShopPage';
import ThankYouPage from '@/pages/ThankYouPage';

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminOrderCreatePage = lazy(() => import('@/pages/admin/AdminOrderCreatePage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'));
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));

function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<PageLoader label="Nalaganje …" />}>
        <Outlet />
      </Suspense>
    </AdminAuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <CartProvider>
          <Routes>
            <Route path="/admin" element={<AdminRoot />}>
              <Route path="prijava" element={<AdminLoginPage />} />
              <Route element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="narocila" element={<AdminOrdersPage />} />
                <Route path="narocila/ustvari" element={<AdminOrderCreatePage />} />
                <Route path="narocila/:id" element={<AdminOrderDetailPage />} />
                <Route path="uporabniki" element={<AdminUsersPage />} />
                <Route path="izdelki" element={<AdminProductsPage />} />
                <Route path="izdelki/:id" element={<AdminProductEditPage />} />
                <Route path="analitika" element={<AdminAnalyticsPage />} />
                <Route path="nastavitve" element={<AdminSettingsPage />} />
                <Route path="*" element={<AdminOverviewPage />} />
              </Route>
            </Route>
            <Route path="/blagajna" element={<CheckoutPage />} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="trgovina" element={<ShopPage />} />
              <Route path="trgovina/:category" element={<ShopPage />} />
              <Route path="izdelek/:slug" element={<ProductPage />} />
              <Route path="pogosta-vprasanja" element={<FaqPage />} />
              <Route path="kontakt" element={<ContactPage />} />
              <Route path="pravno/:slug" element={<PolicyPage />} />
              <Route path="prijava" element={<AccountPage />} />
              <Route path="hvala" element={<ThankYouPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <CookieConsent />
        </CartProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
