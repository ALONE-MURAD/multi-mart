import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher';
import {
  subscribeActiveCategories,
  subscribeCart,
  subscribeWishlist,
  subscribeUserNotifications,
  subscribeHomepageSettings,
  markNotificationRead,
} from '../../services/firestoreService';
import { DEFAULT_HOMEPAGE_SETTINGS } from '../../shared/utils';
import type { AppNotification, Category, HomepageSettings } from '../../shared/types';

export const Navbar: React.FC = () => {
  const { firebaseUser, profile, isApprovedSeller, isAdmin, logout } = useAuth();
  const { t, pickText } = useI18n();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(
    DEFAULT_HOMEPAGE_SETTINGS
  );

  const [showCategories, setShowCategories] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubCat = subscribeActiveCategories(setCategories);
    const unsubHome = subscribeHomepageSettings(setHomepageSettings);
    return () => {
      unsubCat();
      unsubHome();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setCartCount(0);
      setWishlistCount(0);
      setNotifications([]);
      return;
    }
    const unsubCart = subscribeCart(firebaseUser.uid, (items) => {
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    });
    const unsubWish = subscribeWishlist(firebaseUser.uid, (ids) => {
      setWishlistCount(ids.length);
    });
    const unsubNotif = subscribeUserNotifications(firebaseUser.uid, setNotifications);
    return () => {
      unsubCart();
      unsubWish();
      unsubNotif();
    };
  }, [firebaseUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {homepageSettings.announcementActive && (
        <div className="bg-slate-900 px-4 py-1.5 text-center text-xs font-medium text-slate-100">
          {pickText(homepageSettings.announcementEn, homepageSettings.announcementBn)}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link
              to="/"
              className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            >
              {t.brandName}
            </Link>
          </div>

          {/* Zone 2: Concise Navigation & Search */}
          <div className="hidden lg:flex items-center gap-6 flex-1 max-w-2xl">
            <div
              className="relative shrink-0"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button
                type="button"
                onClick={() => setShowCategories((v) => !v)}
                className="inline-flex items-center gap-1 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 whitespace-nowrap"
              >
                <span>{t.nav.categories}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showCategories && (
                <div className="absolute left-0 top-full w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50">
                  {categories.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500">No active categories yet.</p>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setShowCategories(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                      >
                        {pickText(cat.nameEn, cat.nameBn)}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-1">
              <div className="relative flex w-full">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.nav.searchPlaceholder}
                  className="w-full rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-r-lg bg-emerald-600 px-3.5 text-white hover:bg-emerald-700 transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-600 mr-1">
              <Link
                to={isApprovedSeller ? '/seller' : '/seller/onboarding'}
                className="hover:text-emerald-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                {isApprovedSeller ? t.nav.sellerDashboard : t.nav.sellOnMultiMart}
              </Link>
              {!isAdmin && (
                <Link
                  to="/admin/login"
                  className="hover:text-emerald-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  {t.nav.adminDashboard}
                </Link>
              )}
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {t.nav.adminDashboard}
              </Link>
            )}

            <LanguageSwitcher />

            {firebaseUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white tabular-nums">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-700">Notifications</span>
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-500">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={async () => {
                              if (!n.isRead) await markNotificationRead(firebaseUser.uid, n.id);
                              setShowNotifs(false);
                              if (n.linkUrl) navigate(n.linkUrl);
                            }}
                            className={`w-full rounded-lg p-2.5 text-left transition-colors ${
                              n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/70 hover:bg-emerald-50'
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900">
                              {pickText(n.titleEn, n.titleBn)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2">
                              {pickText(n.messageEn, n.messageBn)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/wishlist"
              className="relative hidden sm:inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label={t.nav.wishlist}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100"
              aria-label={t.nav.cart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </Link>

            {firebaseUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="max-w-24 truncate">{profile?.displayName || 'Account'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  title={t.nav.logout}
                  aria-label={t.nav.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearchSubmit} className="pb-3 lg:hidden">
          <div className="relative flex w-full">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3.5 py-2 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-r-lg bg-emerald-600 px-3.5 text-white"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">{t.nav.categories}</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {pickText(cat.nameEn, cat.nameBn)}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <Link
              to={isApprovedSeller ? '/seller' : '/seller/onboarding'}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
            >
              {isApprovedSeller ? t.nav.sellerDashboard : t.nav.sellOnMultiMart}
            </Link>
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {t.nav.adminDashboard}
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {t.nav.orders}
            </Link>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {t.nav.support}
            </Link>
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                {t.nav.logout}
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
