import React, { useEffect, useState } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllCategories,
  saveCategory,
  deleteCategory,
} from '../../services/firestoreService';
import { getReadableErrorMessage, slugify } from '../../shared/utils';
import type { Category } from '../../shared/types';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [slug, setSlug] = useState('');
  const [iconName, setIconName] = useState('Package');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    return subscribeAllCategories(setCategories);
  }, []);

  const resetForm = () => {
    setEditingId(undefined);
    setNameEn('');
    setNameBn('');
    setSlug('');
    setIconName('Package');
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCategory(
        {
          nameEn: nameEn.trim(),
          nameBn: nameBn.trim() || nameEn.trim(),
          slug: slugify(slug || nameEn),
          iconName,
          sortOrder: Number(sortOrder) || 1,
          isActive,
          descriptionEn: '',
          descriptionBn: '',
          imageUrl: '',
        },
        editingId
      );
      showToast(editingId ? 'Category updated' : 'Category created', 'success');
      resetForm();
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameEn(cat.nameEn);
    setNameBn(cat.nameBn);
    setSlug(cat.slug);
    setIconName(cat.iconName || 'Package');
    setSortOrder(String(cat.sortOrder));
    setIsActive(cat.isActive);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      showToast('Category deleted', 'info');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            required
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value);
              if (!editingId) setSlug(slugify(e.target.value));
            }}
            placeholder="Name (English)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
            placeholder="নাম (বাংলা)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (e.g. electronics)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
          />
          <select
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="Shirt">Shirt</option>
            <option value="Headphones">Headphones</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Watch">Watch</option>
            <option value="Sofa">Sofa</option>
            <option value="Tv">Tv</option>
            <option value="Package">Package</option>
          </select>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="Order"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-emerald-600"
            />
            Active on storefront
          </label>

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Bangla</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono tabular-nums">{c.sortOrder}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{c.nameEn}</td>
                <td className="px-4 py-3 text-slate-700">{c.nameBn}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.slug}</td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {c.isActive ? (
                    <span className="text-emerald-700">Active</span>
                  ) : (
                    <span className="text-slate-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(c)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.id)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
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
    </div>
  );
}
