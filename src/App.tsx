import React, { Suspense, lazy } from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { useAuth } from './shared/contexts/AuthContext';
import { CustomerLayout } from './customer/layouts/CustomerLayout';
import { SellerLayout } from './seller/layouts/SellerLayout';
import { AdminLayout } from './admin/layouts/AdminLayout';

const HomePage = lazy(() => import('./customer/pages/HomePage'));
const CategoryPage = lazy(() => import('./customer/pages/CategoryPage'));
const SearchPage = lazy(() => import('./customer/pages/SearchPage'));
const ProductDetailPage = lazy(() => import('./customer/pages/ProductDetailPage'));
const StorefrontSellerPage = lazy(() => import('./customer/pages/StorefrontSellerPage'));
const CartPage = lazy(() => import('./customer/pages/CartPage'));
const WishlistPage = lazy(() => import('./customer/pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./customer/pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./customer/pages/OrdersPage'));
const OrderTrackingPage = lazy(() => import('./customer/pages/OrderTrackingPage'));
const ProfilePage = lazy(() => import('./customer/pages/ProfilePage'));
const SupportPage = lazy(() => import('./customer/pages/SupportPage'));
const AuthPages = lazy(() => import('./customer/pages/AuthPages'));

const SellerOnboardingPage = lazy(() => import('./seller/pages/SellerOnboardingPage'));
const SellerOverviewPage = lazy(() => import('./seller/pages/SellerOverviewPage'));
const SellerProductsPage = lazy(() => import('./seller/pages/SellerProductsPage'));
const SellerProductFormPage = lazy(() => import('./seller/pages/SellerProductFormPage'));
const SellerOrdersPage = lazy(() => import('./seller/pages/SellerOrdersPage'));
const SellerEarningsPage = lazy(() => import('./seller/pages/SellerEarningsPage'));
const SellerProfilePage = lazy(() => import('./seller/pages/SellerProfilePage'));

const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage'));
const AdminOverviewPage = lazy(() => import('./admin/pages/AdminOverviewPage'));
const AdminProductsPage = lazy(() => import('./admin/pages/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./admin/pages/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./admin/pages/AdminCategoriesPage'));
const AdminSellersPage = lazy(() => import('./admin/pages/AdminSellersPage'));
const AdminUsersPage = lazy(() => import('./admin/pages/AdminUsersPage'));
const AdminOrdersPage = lazy(() => import('./admin/pages/AdminOrdersPage'));
const AdminBannersPage = lazy(() => import('./admin/pages/AdminBannersPage'));
const AdminAdsPage = lazy(() => import('./admin/pages/AdminAdsPage'));
const AdminSettingsPage = lazy(() => import('./admin/pages/AdminSettingsPage'));

const PageLoader: React.FC = () => (
  <div className="min-h-[55vh] flex items-center justify-center">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
  </div>
);

const SellerGuardFallback: React.FC = () => {
  const { firebaseUser } = useAuth();
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <Navigate to="/seller/onboarding" replace />;
};

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Customer Storefront */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/store/:sellerId" element={<StorefrontSellerPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/login" element={<AuthPages mode="login" />} />
          <Route path="/register" element={<AuthPages mode="register" />} />
          <Route path="/reset-password" element={<AuthPages mode="reset" />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" replace />}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" replace />}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" replace />}>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" replace />}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/onboarding"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" replace />}>
                <SellerOnboardingPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Seller Dashboard */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute requireApprovedSeller fallback={<SellerGuardFallback />}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerOverviewPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="products/new" element={<SellerProductFormPage />} />
          <Route path="products/:id/edit" element={<SellerProductFormPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="earnings" element={<SellerEarningsPage />} />
          <Route path="profile" element={<SellerProfilePage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin fallback={<Navigate to="/admin/login" replace />}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="ads" element={<AdminAdsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
              <p className="mt-2 text-slate-600">The page you requested could not be found.</p>
              <Link
                to="/"
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Back to MultiMart BD
              </Link>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
