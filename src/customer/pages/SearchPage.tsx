import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  subscribeActiveCategories,
  fetchPaginatedProducts,
  subscribeWishlist,
} from '../../services/firestoreService';
import { ProductCardSkeleton } from '../../shared/components/ProductCardSkeleton';
import { Pagination } from '../../shared/components/Pagination';
import type { Category, Product } from '../../shared/types';
import { ProductCard } from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { firebaseUser } = useAuth();
  const { t, pickText } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    return subscribeActiveCategories(setCategories);
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setPage(1);
    setCursors([null]);
  }, [searchParams]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeWishlist(firebaseUser.uid, setWishlistIds);
  }, [firebaseUser]);

  const runQuery = useCallback(
    async (targetPage: number, cursorDoc: QueryDocumentSnapshot<DocumentData> | null) => {
      setLoading(true);
      try {
        const res = await fetchPaginatedProducts({
          categorySlug: selectedCategory || undefined,
          searchTerm: searchTerm || undefined,
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
    [selectedCategory, searchTerm, sortBy, minPrice, maxPrice]
  );

  useEffect(() => {
    void runQuery(page, cursors[page - 1] ?? null);
  }, [page, sortBy, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams: Record<string, string> = {};
    if (searchTerm.trim()) nextParams.q = searchTerm.trim();
    if (selectedCategory) nextParams.category = selectedCategory;
    setSearchParams(nextParams);
    setPage(1);
    void runQuery(1, null);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleApply}
        className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.nav.searchPlaceholder}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => {
            setPage(1);
            setSelectedCategory(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {pickText(c.nameEn, c.nameBn)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min ৳"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
        />
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max ৳"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
          >
            {t.product.applyFilters}
          </button>
          <select
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value as 'newest' | 'price_asc' | 'price_desc');
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold"
          >
            <option value="newest">{t.product.sortNewest}</option>
            <option value="price_asc">{t.product.sortPriceAsc}</option>
            <option value="price_desc">{t.product.sortPriceDesc}</option>
          </select>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No matching products found. Try adjusting your filters.
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
