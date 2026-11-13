import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeActiveAdvertisements, trackPromoEvent } from '../../services/firestoreService';
import { useI18n } from '../../shared/contexts/I18nContext';
import { isValidSafeUrl } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Advertisement, AdPlacementType } from '../../shared/types';

export const AdPlacement: React.FC<{
  placement: AdPlacementType;
  categorySlug?: string;
}> = ({ placement, categorySlug }) => {
  const { t, pickText } = useI18n();
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    return subscribeActiveAdvertisements(placement, setAds, categorySlug);
  }, [placement, categorySlug]);

  useEffect(() => {
    ads.forEach((ad) => {
      void trackPromoEvent({
        targetCollection: 'advertisements',
        targetId: ad.id,
        eventType: 'impression',
      });
    });
  }, [ads]);

  if (ads.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ads.slice(0, 2).map((ad) => {
        const dest = isValidSafeUrl(ad.destinationUrl) ? ad.destinationUrl : '/search';
        const isExternal = dest.startsWith('http');
        const onAdClick = () =>
          void trackPromoEvent({
            targetCollection: 'advertisements',
            targetId: ad.id,
            eventType: 'click',
          });

        const content = (
          <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
            <div className="h-44 sm:h-52 w-full overflow-hidden bg-slate-100">
              <SafeImage
                src={ad.imageUrl}
                alt={pickText(ad.titleEn, ad.titleBn)}
                className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900 truncate">
                {pickText(ad.titleEn, ad.titleBn)}
              </span>
              <span className="text-xs text-slate-500 shrink-0 ml-3">
                {t.common.sponsored}
                {ad.sponsorName ? ` · ${ad.sponsorName}` : ''}
              </span>
            </div>
          </div>
        );

        return isExternal ? (
          <a key={ad.id} href={dest} target="_blank" rel="noopener noreferrer" onClick={onAdClick}>
            {content}
          </a>
        ) : (
          <Link key={ad.id} to={dest} onClick={onAdClick}>
            {content}
          </Link>
        );
      })}
    </section>
  );
};
