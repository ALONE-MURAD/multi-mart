import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { subscribeWishlist, getProductById } from '../../services/firestoreService';
import type { Product } from '../../shared/types';
import { ProductCard } from '../components/ProductCard';

export default function WishlistPage() {
  const { firebaseUser } = useAuth();
  const { t } = useI18n();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }
    return subscribeWishlist(firebaseUser.uid, async (ids) => {
      setWishlistIds(ids);
      const loaded = await Promise.all(ids.map((pid) => getProductById(pid)));
      setProducts(loaded.filter((p): p is Product => Boolean(p && p.isActive)));
      setLoading(false);
    });
  }, [firebaseUser]);

  if (!firebaseUser) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-600">Sign in to view your saved wishlist.</p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.nav.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t.nav.wishlist}</h1>
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Your wishlist is empty.
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
