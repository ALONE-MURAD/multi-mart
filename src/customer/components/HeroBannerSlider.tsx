import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { subscribeActiveBanners, trackPromoEvent } from '../../services/firestoreService';
import { useI18n } from '../../shared/contexts/I18nContext';
import { isValidSafeUrl } from '../../shared/utils';
import { STUDIO_ASSETS } from '../../shared/localAssets';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Banner } from '../../shared/types';

export const HeroBannerSlider: React.FC<{ categorySlug?: string }> = ({ categorySlug }) => {
  const { t, pickText } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    return subscribeActiveBanners(
      categorySlug ? 'category' : 'hero',
      (items) => {
        setBanners(items);
        setActiveIndex(0);
      },
      categorySlug
    );
  }, [categorySlug]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const active = banners[activeIndex];
    if (active) {
      void trackPromoEvent({
        targetCollection: 'banners',
        targetId: active.id,
        eventType: 'impression',
      });
    }
  }, [activeIndex, banners]);

  if (banners.length === 0) {
    if (categorySlug) return null;
    return (
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center p-8 sm:p-12 text-white">
            <p className="text-xs font-medium text-emerald-300">
              MultiMart BD · 64 Districts · BDT (৳)
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.12] max-w-xl">
              {t.tagline}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
              Verified Bangladeshi merchants across clothing, electronics, wearables, and modern home living.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
              >
                {t.home.shopNow} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/seller/onboarding"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {t.nav.sellOnMultiMart}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[380px]">
            <SafeImage
              src={STUDIO_ASSETS.heroDhakaMarketplace}
              alt="MultiMart BD Curated Marketplace Collection"
              loading="eager"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-900/35 lg:to-transparent" />
          </div>
        </div>
      </section>
    );
  }

  const current = banners[activeIndex]!;
  const safeDest = isValidSafeUrl(current.destinationUrl) ? current.destinationUrl : '/search';
  const isExternal = safeDest.startsWith('http');

  const handleClick = () => {
    void trackPromoEvent({ targetCollection: 'banners', targetId: current.id, eventType: 'click' });
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
      <div className="relative aspect-[16/7] min-h-[240px] max-h-[430px] w-full">
        <SafeImage
          src={current.imageUrl}
          alt={pickText(current.titleEn, current.titleBn)}
          loading="eager"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent flex items-center">
          <div className="px-6 sm:px-12 max-w-xl text-white">
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              {pickText(current.titleEn, current.titleBn)}
            </h1>
            {(current.subtitleEn || current.subtitleBn) && (
              <p className="mt-3 text-sm sm:text-base text-slate-200">
                {pickText(current.subtitleEn, current.subtitleBn)}
              </p>
            )}
            <div className="mt-6">
              {isExternal ? (
                <a
                  href={safeDest}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {t.home.shopNow} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={safeDest}
                  onClick={handleClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {t.home.shopNow} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/60 p-2 text-white hover:bg-slate-900/80"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/60 p-2 text-white hover:bg-slate-900/80"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
};
