import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { addToCart, toggleWishlistProduct } from '../../services/firestoreService';
import {
  formatBDT,
  calculateDiscountPercent,
  getReadableErrorMessage,
} from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Product } from '../../shared/types';

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isWishlisted = false }) => {
  const { firebaseUser } = useAuth();
  const { lang, t, pickText } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const discount = calculateDiscountPercent(product.price, product.compareAtPrice);
  const title = pickText(product.titleEn, product.titleBn);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      showToast('Please sign in to add items to your cart.', 'info');
      navigate('/login');
      return;
    }
    try {
      setBusy(true);
      await addToCart(firebaseUser.uid, product, 1);
      showToast('Added to shopping bag', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      showToast('Please sign in to save items.', 'info');
      navigate('/login');
      return;
    }
    try {
      const added = await toggleWishlistProduct(firebaseUser.uid, product.id);
      showToast(added ? 'Saved to wishlist' : 'Removed from wishlist', 'info');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[4/3] overflow-hidden bg-slate-100"
      >
        <SafeImage
          src={product.thumbnailUrl || product.images[0]}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {discount > 0 && product.stock > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
            -{discount}%
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-xs font-bold uppercase tracking-wider text-white">
            {t.product.outOfStock}
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-3 top-3 rounded-full p-2 shadow-xs transition-colors ${
            isWishlisted
              ? 'bg-rose-600 text-white'
              : 'bg-white/90 text-slate-600 hover:text-rose-600'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="truncate">{pickText(product.categoryNameEn, product.categoryNameBn)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{product.sellerName}</span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-1.5 text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 hover:text-emerald-700"
        >
          {title}
        </Link>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-700">
            {product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : 'New'}
          </span>
          {product.ratingCount > 0 && <span>({product.ratingCount})</span>}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="tabular-nums">
            <span className="block text-base font-bold text-slate-900 font-mono">
              {formatBDT(product.price, lang)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-mono">
                {formatBDT(product.compareAtPrice, lang)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={busy || product.stock <= 0}
            onClick={handleAddToCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            title={t.product.addToCart}
            aria-label={t.product.addToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
