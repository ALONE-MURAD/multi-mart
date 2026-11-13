import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  getSellerById,
  subscribePublicProducts,
  subscribeWishlist,
} from '../../services/firestoreService';
import type { Product, SellerProfile } from '../../shared/types';
import { ProductCard } from '../components/ProductCard';

export default function StorefrontSellerPage() {
  const { sellerId = '' } = useParams();
  const { firebaseUser } = useAuth();
  const { pickText } = useI18n();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getSellerById(sellerId).then((s) => {
      setSeller(s);
      setLoading(false);
    });
    return subscribePublicProducts({ sellerId, limitCount: 40 }, setProducts);
  }, [sellerId]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeWishlist(firebaseUser.uid, setWishlistIds);
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {seller?.storeName || 'Vendor Storefront'}
              </h1>
              {seller?.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              )}
            </div>
            {(seller?.descriptionEn || seller?.descriptionBn) && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {pickText(seller.descriptionEn, seller.descriptionBn)}
              </p>
            )}
          </div>
          {seller && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>
                {seller.district}, {seller.division}
              </span>
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          This store has no published products yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
