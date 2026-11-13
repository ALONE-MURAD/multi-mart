import React, { useEffect, useState } from 'react';
import { Trash2, Edit3, Upload } from 'lucide-react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllBannersAdmin,
  saveBanner,
  deleteBanner,
} from '../../services/firestoreService';
import { uploadImageFile } from '../../services/storageService';
import { getReadableErrorMessage } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Banner, BannerPlacement } from '../../shared/types';

export default function AdminBannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [subtitleBn, setSubtitleBn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/search');
  const [placement, setPlacement] = useState<BannerPlacement>('hero');
  const [categorySlug, setCategorySlug] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return subscribeAllBannersAdmin(setBanners);
  }, []);

  const resetForm = () => {
    setEditingId(undefined);
    setTitleEn('');
    setTitleBn('');
    setSubtitleEn('');
    setSubtitleBn('');
    setImageUrl('');
    setDestinationUrl('/search');
    setPlacement('hero');
    setCategorySlug('');
    setSortOrder('1');
    setIsActive(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImageFile(file, 'marketing/banners');
      setImageUrl(url);
      showToast('Banner image uploaded', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      showToast('Provide or upload a banner image URL.', 'error');
      return;
    }
    try {
      await saveBanner(
        {
          titleEn: titleEn.trim(),
          titleBn: titleBn.trim(),
          subtitleEn: subtitleEn.trim(),
          subtitleBn: subtitleBn.trim(),
          imageUrl: imageUrl.trim(),
          destinationUrl: destinationUrl.trim() || '/search',
          placement,
          categorySlug: categorySlug.trim(),
          sortOrder: Number(sortOrder) || 1,
          isActive,
        },
        editingId
      );
      showToast(editingId ? 'Banner updated' : 'Banner published', 'success');
      resetForm();
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleEdit = (b: Banner) => {
    setEditingId(b.id);
    setTitleEn(b.titleEn);
    setTitleBn(b.titleBn || '');
    setSubtitleEn(b.subtitleEn || '');
    setSubtitleBn(b.subtitleBn || '');
    setImageUrl(b.imageUrl);
    setDestinationUrl(b.destinationUrl);
    setPlacement(b.placement);
    setCategorySlug(b.categorySlug || '');
    setSortOrder(String(b.sortOrder));
    setIsActive(b.isActive);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Banner Management</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Headline (English)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="শিরোনাম (বাংলা)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={subtitleEn}
            onChange={(e) => setSubtitleEn(e.target.value)}
            placeholder="Subtitle (English)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={subtitleBn}
            onChange={(e) => setSubtitleBn(e.target.value)}
            placeholder="উপ-শিরোনাম (বাংলা)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            <option value="hero">Homepage Hero Slider</option>
            <option value="category">Category Top Banner</option>
          </select>
          <input
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            placeholder="Category Slug (optional, for category placement)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="Destination URL (e.g. /search or /category/mens-apparel)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="Sort Order"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          <input
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste image URL (https://...)"
            className="flex-1 min-w-60 rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
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
              {editingId ? 'Update Banner' : 'Publish Banner'}
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-40 w-full bg-slate-100">
              <SafeImage src={b.imageUrl} alt={b.titleEn} />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{b.titleEn}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {b.placement} · {b.isActive ? 'Active' : 'Hidden'} · {b.impressions} views ·{' '}
                  {b.clicks} clicks
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(b)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteBanner(b.id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
