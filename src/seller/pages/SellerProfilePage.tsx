import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  getSellerPrivateDetails,
  registerOrUpdateSeller,
} from '../../services/firestoreService';
import {
  BANGLADESH_DIVISIONS,
  getReadableErrorMessage,
  isValidBDPhone,
} from '../../shared/utils';
import type { PayoutMethod } from '../../shared/types';

export default function SellerProfilePage() {
  const { firebaseUser, sellerProfile, profile } = useAuth();
  const { showToast } = useToast();

  const [storeName, setStoreName] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [division, setDivision] = useState<string>('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [phone, setPhone] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bkash');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sellerProfile) {
      setStoreName(sellerProfile.storeName);
      setDescriptionEn(sellerProfile.descriptionEn || '');
      setDescriptionBn(sellerProfile.descriptionBn || '');
      setDivision(sellerProfile.division);
      setDistrict(sellerProfile.district);
    }
    if (firebaseUser) {
      void getSellerPrivateDetails(firebaseUser.uid).then((priv) => {
        if (priv) {
          setPhone(priv.phone);
          setPayoutMethod(priv.payoutMethod);
          setPayoutNumber(priv.payoutNumber);
          setNidNumber(priv.nidNumber || '');
        }
      });
    }
  }, [sellerProfile, firebaseUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!isValidBDPhone(phone)) {
      showToast('Enter a valid Bangladeshi phone number.', 'error');
      return;
    }
    try {
      setSaving(true);
      await registerOrUpdateSeller({
        uid: firebaseUser.uid,
        storeName,
        descriptionEn,
        descriptionBn,
        division,
        district,
        phone,
        email: profile?.email || firebaseUser.email || '',
        payoutMethod,
        payoutNumber,
        nidNumber,
        isNew: !sellerProfile,
      });
      showToast('Store profile saved', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Store Profile & Payouts</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store Name"
            className="sm:col-span-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            {BANGLADESH_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Business Mobile"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={nidNumber}
            onChange={(e) => setNidNumber(e.target.value)}
            placeholder="NID / Trade License"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <select
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank Transfer</option>
          </select>
          <input
            required
            value={payoutNumber}
            onChange={(e) => setPayoutNumber(e.target.value)}
            placeholder="Payout Number"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
        </div>
        <textarea
          rows={3}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Store description (English)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <textarea
          rows={2}
          value={descriptionBn}
          onChange={(e) => setDescriptionBn(e.target.value)}
          placeholder="স্টোরের বিবরণ (বাংলা)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
