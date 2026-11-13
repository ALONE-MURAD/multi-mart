import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  subscribeActiveCategories,
  subscribePublicProducts,
  subscribeHomepageSettings,
  subscribeWishlist,
} from '../../services/firestoreService';
import { ProductCardSkeleton } from '../../shared/components/ProductCardSkeleton';
import { DEFAULT_HOMEPAGE_SETTINGS } from '../../shared/utils';
import type { Category, HomepageSettings, Product } from '../../shared/types';
import { HeroBannerSlider } from '../components/HeroBannerSlider';
import { CategoryStrip } from '../components/CategoryStrip';
import { ProductCard } from '../components/ProductCard';
import { AdPlacement } from '../components/AdPlacement';

export default function HomePage() {
  const { firebaseUser, isAdmin } = useAuth();
  const { t, pickText } = useI18n();

  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(
    DEFAULT_HOMEPAGE_SETTINGS
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uHome = subscribeHomepageSettings(setHomepageSettings);
    const uCat = subscribeActiveCategories(setCategories);
    const uFeat = subscribePublicProducts({ featuredOnly: true, limitCount: 8 }, setFeaturedProducts);
    const uLatest = subscribePublicProducts({ limitCount: 12 }, (items) => {
      setLatestProducts(items);
      setLoading(false);
    });
    return () => {
      uHome();
      uCat();
      uFeat();
      uLatest();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setWishlistIds([]);
      return;
    }
    return subscribeWishlist(firebaseUser.uid, setWishlistIds);
  }, [firebaseUser]);

  const orderedSections = useMemo(
    () =>
      [...homepageSettings.sections]
        .filter((s) => s.isEnabled)
        .sort((a, b) => a.order - b.order),
    [homepageSettings.sections]
  );

  const renderProductGrid = (items: Product[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-sm text-slate-600">{t.home.noProductsYet}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {t.nav.adminDashboard}
            </Link>
            <Link
              to="/seller/onboarding"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.nav.sellOnMultiMart}
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistIds.includes(product.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {orderedSections.map((sec) => {
        if (sec.type === 'hero') return <HeroBannerSlider key={sec.id} />;

        if (sec.type === 'categories') {
          return (
            <section key={sec.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {pickText(sec.titleEn, sec.titleBn)}
                </h2>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                >
                  {t.home.viewAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <CategoryStrip categories={categories} />
            </section>
          );
        }

        if (sec.type === 'mid_ad') {
          return <AdPlacement key={sec.id} placement="homepage_mid" />;
        }

        if (sec.type === 'featured') {
          return (
            <section key={sec.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {pickText(sec.titleEn, sec.titleBn)}
                </h2>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                >
                  {t.home.viewAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {renderProductGrid(featuredProducts)}
            </section>
          );
        }

        if (sec.type === 'new_arrivals') {
          return (
            <section key={sec.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {pickText(sec.titleEn, sec.titleBn)}
                </h2>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                >
                  {t.home.viewAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {renderProductGrid(latestProducts)}
            </section>
          );
        }

        if (sec.type === 'bottom_ad') {
          return <AdPlacement key={sec.id} placement="bottom_page" />;
        }

        return null;
      })}

      {/* Marketplace Value Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 pt-8">
        {[
          { title: t.home.trustedDelivery, desc: t.home.trustedDeliveryDesc },
          { title: t.home.securePayments, desc: t.home.securePaymentsDesc },
          { title: t.home.verifiedSellers, desc: t.home.verifiedSellersDesc },
          { title: t.home.support247, desc: t.home.support247Desc },
        ].map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
