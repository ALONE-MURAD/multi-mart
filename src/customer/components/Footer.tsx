import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  subscribePlatformSettings,
  subscribeActiveCategories,
} from '../../services/firestoreService';
import { DEFAULT_PLATFORM_SETTINGS } from '../../shared/utils';
import type { Category, PlatformSettings } from '../../shared/types';

export const Footer: React.FC = () => {
  const { t, pickText } = useI18n();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const u1 = subscribePlatformSettings(setSettings);
    const u2 = subscribeActiveCategories(setCategories);
    return () => {
      u1();
      u2();
    };
  }, []);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300 pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <span className="text-lg font-extrabold text-white">{settings.siteName}</span>
            <p className="text-xs leading-relaxed text-slate-400">{t.tagline}</p>
            <div className="space-y-1 pt-2 text-xs text-slate-400">
              <p>{settings.supportPhone}</p>
              <p>{settings.supportEmail}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">{t.nav.categories}</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {categories.length === 0 ? (
                <li className="text-slate-500">Categories load live from Firestore</li>
              ) : (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.slug}`} className="hover:text-emerald-400">
                      {pickText(cat.nameEn, cat.nameBn)}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Marketplace</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/seller/onboarding" className="hover:text-emerald-400">
                  {t.nav.sellOnMultiMart}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-400">
                  {t.nav.adminDashboard}
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-emerald-400">
                  {t.nav.orders}
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-emerald-400">
                  {t.nav.support}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Bangladesh Delivery & Payments</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-400">
              <p>64-District Courier Coverage (BDT ৳)</p>
              <p>Cash on Delivery · bKash · Nagad · SSLCommerz</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
          <p>BDT (৳) · English / বাংলা</p>
        </div>
      </div>
    </footer>
  );
};
