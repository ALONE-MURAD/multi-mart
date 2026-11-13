import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  getCategoryBySlug,
  fetchPaginatedProducts,
  subscribeWishlist,
} from '../../services/firestoreService';
import { ProductCardSkeleton } from '../../shared/components/ProductCardSkeleton';
import { Pagination } from '../../shared/components/Pagination';
import type { Category, Product } from '../../shared/types';
import { HeroBannerSlider } from '../components/HeroBannerSlider';
import { AdPlacement } from '../components/AdPlacement';
import { ProductCard } from '../components/ProductCard';

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const { firebaseUser } = useAuth();
  const { t, pickText } = useI18n();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    void getCategoryBySlug(slug).then(setCategory);
    setPage(1);
    setCursors([null]);
  }, [slug]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeWishlist(firebaseUser.uid, setWishlistIds);
  }, [firebaseUser]);

  const loadProducts = useCallback(
    async (targetPage: number, cursorDoc: QueryDocumentSnapshot<DocumentData> | null) => {
      setLoading(true);
      try {
        const res = await fetchPaginatedProducts({
          categorySlug: slug,
          sortBy,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          cursor: cursorDoc,
        });
        setProducts(res.items);
        setHasMore(res.hasMore);
        if (res.lastDoc) {
          setCursors((prev) => {
            const copy = [...prev];
            copy[targetPage] = res.lastDoc;
            return copy;
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [slug, sortBy, minPrice, maxPrice]
  );

  useEffect(() => {
    void loadProducts(page, cursors[page - 1] ?? null);
  }, [page, sortBy, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <HeroBannerSlider categorySlug={slug} />
      <AdPlacement placement="category_top" categorySlug={slug} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">
            {category ? pickText(category.nameEn, category.nameBn) : slug.replace(/-/g, ' ')}
          </h1>
          {category && (category.descriptionEn || category.descriptionBn) && (
            <p className="mt-1 text-xs text-slate-500">
              {pickText(category.descriptionEn, category.descriptionBn)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min ৳"
            className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-xs tabular-nums"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max ৳"
            className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-xs tabular-nums"
          />
          <button
            type="button"
            onClick={() => {
              setPage(1);
              void loadProducts(1, null);
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {t.product.applyFilters}
          </button>

          <select
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value as 'newest' | 'price_asc' | 'price_desc');
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="newest">{t.product.sortNewest}</option>
            <option value="price_asc">{t.product.sortPriceAsc}</option>
            <option value="price_desc">{t.product.sortPriceDesc}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No published products found in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        hasPrev={page > 1}
        hasNext={hasMore}
        loading={loading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
