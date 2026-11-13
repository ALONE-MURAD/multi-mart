import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeActiveCategories,
  getProductById,
  saveProduct,
} from '../../services/firestoreService';
import { uploadImageFile } from '../../services/storageService';
import { getReadableErrorMessage } from '../../shared/utils';
import type { Category } from '../../shared/types';

export default function SellerProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { firebaseUser, sellerProfile, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeActiveCategories((cats) => {
      setCategories(cats);
      if (!categorySlug && cats.length > 0) setCategorySlug(cats[0]!.slug);
    });
  }, [categorySlug]);

  useEffect(() => {
    if (!id) return;
    void getProductById(id).then((p) => {
      if (!p) return;
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
    });
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    try {
      setUploading(true);
      const url = await uploadImageFile(file, `products/${firebaseUser.uid}`);
      setImages((prev) => [...prev, url]);
      showToast('Image uploaded to Firebase Storage', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) {
      showToast('Please select a category.', 'error');
      return;
    }
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      showToast('Enter a valid BDT price.', 'error');
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
          sellerId: firebaseUser.uid,
          sellerName: sellerProfile?.storeName || profile?.displayName || 'Seller Store',
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
          isApproved: true,
          isFeatured: false,
        },
        id
      );
      showToast(isEdit ? 'Product updated' : 'Product published', 'success');
      navigate('/seller/products');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? 'Edit Product' : 'Upload New Product'}
      </h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nameEn} ({c.nameBn})
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
            placeholder="পণ্যের নাম (বাংলা - ঐচ্ছিক)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            required
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price in BDT (৳)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            type="number"
            min={0}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="Compare-at Price (৳, optional)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock Quantity"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU (optional)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
        </div>

        <textarea
          required
          rows={4}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Product Description (English)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <textarea
          rows={3}
          value={descriptionBn}
          onChange={(e) => setDescriptionBn(e.target.value)}
          placeholder="পণ্যের বিবরণ (বাংলা - ঐচ্ছিক)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Search tags (comma-separated, e.g. cotton, panjabi, eid)"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
        />

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-emerald-600"
          />
          Publish product immediately on storefront
        </label>
      </div>

      {/* Product Images */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Product Images</h2>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <div className="flex flex-1 min-w-60 gap-2">
            <input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Or paste image URL (https://...)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
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
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specifications */}
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
              placeholder="Attribute (e.g. Material)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={row.value}
              onChange={(e) =>
                setSpecs((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                )
              }
              placeholder="Value (e.g. 100% Cotton)"
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
