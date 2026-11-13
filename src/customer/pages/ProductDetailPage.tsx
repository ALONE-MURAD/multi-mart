import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Star,
  Store,
  CheckCircle2,
  ShieldCheck,
  Minus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeProductById,
  subscribeProductReviews,
  subscribeWishlist,
  getSellerById,
  addToCart,
  toggleWishlistProduct,
  submitProductReview,
} from '../../services/firestoreService';
import {
  formatBDT,
  calculateDiscountPercent,
  getReadableErrorMessage,
} from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Product, Review, SellerProfile } from '../../shared/types';

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const { firebaseUser, profile } = useAuth();
  const { lang, t, pickText } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    const uProd = subscribeProductById(id, (p) => {
      setProduct(p);
      setLoading(false);
      if (p) void getSellerById(p.sellerId).then(setSeller);
    });
    const uRev = subscribeProductReviews(id, setReviews);
    return () => {
      uProd();
      uRev();
    };
  }, [id]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeWishlist(firebaseUser.uid, setWishlistIds);
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-slate-200">
        <p className="text-slate-600">Product not found or no longer available.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-emerald-700">
          Back to Home
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [product.thumbnailUrl];
  const discount = calculateDiscountPercent(product.price, product.compareAtPrice);
  const isWishlisted = wishlistIds.includes(product.id);

  const handleAdd = async (goToCheckout = false) => {
    if (!firebaseUser) {
      showToast('Please sign in first.', 'info');
      navigate('/login');
      return;
    }
    try {
      await addToCart(firebaseUser.uid, product, qty);
      showToast('Added to shopping bag', 'success');
      if (goToCheckout) navigate('/checkout');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      navigate('/login');
      return;
    }
    if (reviewComment.trim().length < 3) {
      showToast('Please write a brief review comment.', 'error');
      return;
    }
    try {
      setSubmittingReview(true);
      await submitProductReview({
        productId: product.id,
        sellerId: product.sellerId,
        userId: firebaseUser.uid,
        userName: profile.displayName,
        rating,
        comment: reviewComment,
      });
      setReviewComment('');
      showToast('Review submitted', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        {/* Gallery */}
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <SafeImage
              src={images[selectedImage] || images[0]}
              alt={pickText(product.titleEn, product.titleBn)}
              loading="eager"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    selectedImage === i ? 'border-emerald-600' : 'border-slate-200'
                  }`}
                >
                  <SafeImage src={img} alt={`${product.titleEn} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Module */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <Link
              to={`/category/${product.categorySlug}`}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {pickText(product.categoryNameEn, product.categoryNameBn)}
            </Link>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {pickText(product.titleEn, product.titleBn)}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : 'New'}
                {product.ratingCount > 0 && ` (${product.ratingCount})`}
              </span>
              <span aria-hidden="true">·</span>
              <span>SKU: {product.sku || 'N/A'}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  product.stock > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'
                }
              >
                {product.stock > 0
                  ? `${product.stock} ${t.product.leftInStock}`
                  : t.product.outOfStock}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 rounded-xl bg-slate-50 p-4 tabular-nums">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {formatBDT(product.price, lang)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-base text-slate-400 line-through font-mono">
                  {formatBDT(product.compareAtPrice, lang)}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  -{discount}% {t.product.discountOff}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 text-slate-600 hover:bg-slate-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))}
                className="p-3 text-slate-600 hover:bg-slate-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => void handleAdd(false)}
              className="inline-flex flex-1 min-w-36 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
            >
              <ShoppingCart className="h-4 w-4" /> {t.product.addToCart}
            </button>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => void handleAdd(true)}
              className="inline-flex flex-1 min-w-36 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
            >
              {t.product.buyNow}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!firebaseUser) {
                  navigate('/login');
                  return;
                }
                void toggleWishlistProduct(firebaseUser.uid, product.id);
              }}
              className={`rounded-xl border p-3 ${
                isWishlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{t.product.sellerInfo}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{product.sellerName}</span>
                  {seller?.verified && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t.product.verifiedSeller}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`/store/${product.sellerId}`}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.product.visitStore}
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Cash on Delivery, bKash, Nagad & SSLCommerz supported across 64 districts</span>
          </div>
        </div>
      </div>

      {/* Overview & Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">{t.product.description}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {pickText(product.descriptionEn, product.descriptionBn)}
          </p>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">{t.product.specifications}</h2>
          {Object.keys(product.specifications || {}).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No additional specifications listed.</p>
          ) : (
            <dl className="mt-3 divide-y divide-slate-100 text-sm">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2.5 gap-4">
                  <dt className="font-medium text-slate-500">{key}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">
          {t.product.reviews} ({reviews.length})
        </h2>

        {firebaseUser && (
          <form onSubmit={handleReviewSubmit} className="rounded-xl bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Your Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your honest experience with this product..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : t.product.writeReview}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="border-b border-slate-100 pb-4 last:border-none">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{rev.userName}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-slate-700">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
