import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllCategories,
  subscribeAllSellersAdmin,
  getProductById,
  saveProduct,
} from '../../services/firestoreService';
import { uploadImageFile } from '../../services/storageService';
import { getReadableErrorMessage } from '../../shared/utils';
import type { Category, SellerProfile } from '../../shared/types';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [sellerId, setSellerId] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [sku, setSku] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [isActive, setIsActive] = useState(true);
  const [isApproved, setIsApproved] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uCat = subscribeAllCategories((cats) => {
      setCategories(cats);
      if (!categorySlug && cats.length > 0) setCategorySlug(cats[0]!.slug);
    });
    const uSel = subscribeAllSellersAdmin(setSellers);
    return () => {
      uCat();
      uSel();
    };
  }, [categorySlug]);

  useEffect(() => {
    if (!id) return;
    void getProductById(id).then((p) => {
      if (!p) return;
      setSellerId(p.sellerId);
      setCategorySlug(p.categorySlug);
      setTitleEn(p.titleEn);
      setTitleBn(p.titleBn || '');
      setDescriptionEn(p.descriptionEn);
      setDescriptionBn(p.descriptionBn || '');
      setPrice(String(p.price));
      setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : '');
      setStock(String(p.stock));
      setSku(p.sku || '');
      setImages(p.images.length > 0 ? p.images : p.thumbnailUrl ? [p.thumbnailUrl] : []);
      setTagsInput(p.tags.join(', '));
      setSpecs(Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value })));
      setIsActive(p.isActive);
      setIsApproved(p.isApproved);
      setIsFeatured(p.isFeatured);
    });
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    try {
      setUploading(true);
      const url = await uploadImageFile(file, `products/${firebaseUser.uid}`);
      setImages((prev) => [...prev, url]);
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) {
      showToast('Please create/select a category first.', 'error');
      return;
    }
    const chosenSeller = sellers.find((s) => s.id === sellerId);
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      showToast('Enter a valid price in BDT.', 'error');
      return;
    }

    const specMap: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) specMap[s.key.trim()] = s.value.trim();
    });

    try {
      setSaving(true);
      await saveProduct(
        {
          sellerId: chosenSeller?.id || firebaseUser.uid,
          sellerName: chosenSeller?.storeName || 'MultiMart Official Store',
          categoryId: cat.id,
          categorySlug: cat.slug,
          categoryNameEn: cat.nameEn,
          categoryNameBn: cat.nameBn,
          titleEn,
          titleBn,
          descriptionEn,
          descriptionBn,
          price: numPrice,
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
          stock: Number(stock) || 0,
          sku,
          thumbnailUrl: images[0] || '',
          images,
          specifications: specMap,
          tags: tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          isActive,
          isApproved,
          isFeatured,
        },
        id
      );
      showToast(isEdit ? 'Product updated' : 'Product published to storefront', 'success');
      navigate('/admin/products');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? 'Edit Product (Admin)' : 'Add & Publish Product (Admin)'}
      </h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Store</label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              <option value="">MultiMart Official Store</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName} ({s.status})
                </option>
              ))}
            </select>
          </div>
          <input
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Product Title (English)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="পণ্যের নাম (বাংলা)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            required
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price BDT (৳)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            type="number"
            min={0}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="Compare-at Price BDT (৳)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
        </div>

        <textarea
          required
          rows={4}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Description (English)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <textarea
          rows={3}
          value={descriptionBn}
          onChange={(e) => setDescriptionBn(e.target.value)}
          placeholder="বিবরণ (বাংলা)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
        />

        <div className="flex flex-wrap gap-6 pt-1 text-sm font-medium text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-emerald-600"
            />
            Active
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="accent-emerald-600"
            />
            Approved for Storefront
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-emerald-600"
            />
            Featured on Homepage
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Images</h2>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <div className="flex flex-1 min-w-60 gap-2">
            <input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Paste image URL (https://...)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!imageUrlInput.trim()) return;
                setImages((prev) => [...prev, imageUrlInput.trim()]);
                setImageUrlInput('');
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add URL
            </button>
          </div>
        </div>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div
                key={`${img}-${i}`}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200"
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Specifications</h2>
          <button
            type="button"
            onClick={() => setSpecs((prev) => [...prev, { key: '', value: '' }])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
        </div>
        {specs.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={row.key}
              onChange={(e) =>
                setSpecs((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r))
                )
              }
              placeholder="Key"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={row.value}
              onChange={(e) =>
                setSpecs((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                )
              }
              placeholder="Value"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== idx))}
              className="p-2 text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}
      </button>
    </form>
  );
}
