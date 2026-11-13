import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllProductsAdmin,
  updateProductQuickFields,
  deleteProduct,
} from '../../services/firestoreService';
import { formatBDT, getReadableErrorMessage } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Product } from '../../shared/types';

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    return subscribeAllProductsAdmin(setProducts);
  }, []);

  const filtered = products.filter(
    (p) =>
      p.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryNameEn.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFlag = async (
    p: Product,
    field: 'isActive' | 'isApproved' | 'isFeatured'
  ) => {
    try {
      await updateProductQuickFields(p.id, { [field]: !p[field] });
      showToast('Product updated on storefront', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      showToast('Product deleted', 'info');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
          <p className="text-xs text-slate-500">
            Published & approved products synchronize immediately with the Customer Storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or sellers..."
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm"
          />
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No products found. Add a product or initialize the starter catalog from Overview.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <SafeImage src={p.thumbnailUrl} alt={p.titleEn} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-xs">{p.titleEn}</p>
                        <p className="text-xs text-slate-500">{p.categoryNameEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.sellerName}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatBDT(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{p.stock}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleFlag(p, 'isActive')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        p.isActive && p.isApproved
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isActive && p.isApproved ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleFlag(p, 'isFeatured')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        p.isFeatured
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isFeatured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(p.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
