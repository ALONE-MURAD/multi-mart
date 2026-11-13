import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeSellerProducts,
  updateProductQuickFields,
  deleteProduct,
} from '../../services/firestoreService';
import { formatBDT, getReadableErrorMessage } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Product } from '../../shared/types';

export default function SellerProductsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeSellerProducts(firebaseUser.uid, setProducts);
  }, [firebaseUser]);

  const filtered = products.filter(
    (p) =>
      p.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStockUpdate = async (id: string, stock: number) => {
    try {
      await updateProductQuickFields(id, { stock: Math.max(0, stock) });
      showToast('Stock updated', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await updateProductQuickFields(p.id, { isActive: !p.isActive });
      showToast(p.isActive ? 'Product hidden' : 'Product published', 'info');
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
        <h1 className="text-2xl font-bold text-slate-900">Products & Inventory</h1>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title or SKU..."
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm"
          />
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> New Product
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">No products listed yet.</p>
          <Link
            to="/seller/products/new"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white"
          >
            Upload Your First Product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <SafeImage src={p.thumbnailUrl} alt={p.titleEn} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-xs">{p.titleEn}</p>
                        <p className="text-xs text-slate-500">{p.categoryNameEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatBDT(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== p.stock) void handleStockUpdate(p.id, val);
                      }}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right font-mono text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(p)}
                      className={`text-xs font-semibold ${
                        p.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Hidden'} · {p.isApproved ? 'Approved' : 'Pending'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/seller/products/${p.id}/edit`}
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
