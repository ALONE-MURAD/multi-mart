import React, { useEffect, useState } from 'react';
import { Trash2, Edit3, Upload } from 'lucide-react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllAdsAdmin,
  saveAdvertisement,
  deleteAdvertisement,
} from '../../services/firestoreService';
import { uploadImageFile } from '../../services/storageService';
import { getReadableErrorMessage } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Advertisement, AdPlacementType } from '../../shared/types';

export default function AdminAdsPage() {
  const { showToast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/search');
  const [placement, setPlacement] = useState<AdPlacementType>('homepage_mid');
  const [categorySlug, setCategorySlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return subscribeAllAdsAdmin(setAds);
  }, []);

  const resetForm = () => {
    setEditingId(undefined);
    setTitleEn('');
    setTitleBn('');
    setSponsorName('');
    setImageUrl('');
    setDestinationUrl('/search');
    setPlacement('homepage_mid');
    setCategorySlug('');
    setIsActive(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImageFile(file, 'marketing/ads');
      setImageUrl(url);
      showToast('Ad creative uploaded', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      showToast('Provide or upload an ad image URL.', 'error');
      return;
    }
    try {
      await saveAdvertisement(
        {
          titleEn: titleEn.trim(),
          titleBn: titleBn.trim(),
          sponsorName: sponsorName.trim(),
          imageUrl: imageUrl.trim(),
          destinationUrl: destinationUrl.trim() || '/search',
          placement,
          categorySlug: categorySlug.trim(),
          isActive,
        },
        editingId
      );
      showToast(editingId ? 'Advertisement updated' : 'Advertisement published', 'success');
      resetForm();
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingId(ad.id);
    setTitleEn(ad.titleEn);
    setTitleBn(ad.titleBn || '');
    setSponsorName(ad.sponsorName || '');
    setImageUrl(ad.imageUrl);
    setDestinationUrl(ad.destinationUrl);
    setPlacement(ad.placement);
    setCategorySlug(ad.categorySlug || '');
    setIsActive(ad.isActive);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Advertisement Management</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Campaign Title (English)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="ক্যাম্পেইন শিরোনাম (বাংলা)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Sponsor Brand Name"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as AdPlacementType)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            <option value="homepage_mid">Homepage Mid Spotlight</option>
            <option value="category_top">Category Top Placement</option>
            <option value="bottom_page">Bottom Page Showcase</option>
          </select>
          <input
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="Destination URL (/search or https://...)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            placeholder="Category Slug (optional)"
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
            placeholder="Or paste creative image URL"
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
            Active placement
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
              {editingId ? 'Update Ad' : 'Publish Ad'}
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-40 w-full bg-slate-100">
              <SafeImage src={ad.imageUrl} alt={ad.titleEn} />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{ad.titleEn}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {ad.placement} · {ad.isActive ? 'Active' : 'Hidden'} · {ad.impressions} views ·{' '}
                  {ad.clicks} clicks
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(ad)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAdvertisement(ad.id)}
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
