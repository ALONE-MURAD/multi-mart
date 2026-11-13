import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { updateUserProfileSelf } from '../../services/firestoreService';
import { BANGLADESH_DIVISIONS, getReadableErrorMessage, isValidBDPhone } from '../../shared/utils';
import type { Address } from '../../shared/types';

export default function ProfilePage() {
  const { firebaseUser, profile, isApprovedSeller, isAdmin, logout } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrDivision, setAddrDivision] = useState<string>('Dhaka');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAddrFullName(profile.displayName || '');
      setAddrPhone(profile.phone || '');
    }
  }, [profile]);

  if (!firebaseUser || !profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !isValidBDPhone(phone)) {
      showToast('Enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX).', 'error');
      return;
    }
    try {
      setSaving(true);
      await updateUserProfileSelf(firebaseUser.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBDPhone(addrPhone)) {
      showToast('Enter a valid Bangladeshi phone number.', 'error');
      return;
    }
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      label: addrLabel.trim() || 'Home',
      fullName: addrFullName.trim(),
      phone: addrPhone.trim(),
      division: addrDivision,
      district: addrDistrict.trim(),
      area: addrArea.trim(),
      streetAddress: addrStreet.trim(),
      isDefault: profile.addresses.length === 0,
    };
    try {
      await updateUserProfileSelf(firebaseUser.uid, {
        addresses: [...profile.addresses, newAddr],
      });
      setAddrArea('');
      setAddrStreet('');
      showToast('Address added', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      await updateUserProfileSelf(firebaseUser.uid, {
        addresses: profile.addresses.filter((a) => a.id !== id),
      });
      showToast('Address removed', 'info');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
          <p className="text-xs text-slate-500">
            {profile.email} · Role: {profile.role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav.orders}
          </Link>
          <Link
            to={isApprovedSeller ? '/seller' : '/seller/onboarding'}
            className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            {isApprovedSeller ? t.nav.sellerDashboard : t.nav.sellOnMultiMart}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {t.nav.adminDashboard}
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            {t.nav.logout}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Full Name"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile (e.g. 017XXXXXXXX)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {saving ? 'Saving...' : t.common.save}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Saved Shipping Addresses</h2>
        {profile.addresses.length === 0 ? (
          <p className="text-sm text-slate-500">No saved addresses yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-4 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    {addr.label} · {addr.fullName}
                  </p>
                  <p className="text-slate-600">
                    {addr.streetAddress}, {addr.area}, {addr.district}, {addr.division}
                  </p>
                  <p className="text-slate-500">{addr.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveAddress(addr.id)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                  aria-label="Remove address"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddAddress} className="border-t border-slate-100 pt-5 space-y-3">
          <p className="text-xs font-semibold text-slate-700">Add New Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={addrLabel}
              onChange={(e) => setAddrLabel(e.target.value)}
              placeholder="Label (Home / Office)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              required
              value={addrFullName}
              onChange={(e) => setAddrFullName(e.target.value)}
              placeholder="Recipient Name"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              required
              value={addrPhone}
              onChange={(e) => setAddrPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={addrDivision}
              onChange={(e) => setAddrDivision(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              {BANGLADESH_DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              required
              value={addrDistrict}
              onChange={(e) => setAddrDistrict(e.target.value)}
              placeholder="District"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              required
              value={addrArea}
              onChange={(e) => setAddrArea(e.target.value)}
              placeholder="Area / Thana"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <input
              required
              value={addrStreet}
              onChange={(e) => setAddrStreet(e.target.value)}
              placeholder="House, Road, Holding No."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
