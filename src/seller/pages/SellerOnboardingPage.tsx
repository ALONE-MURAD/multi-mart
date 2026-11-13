import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  registerOrUpdateSeller,
  getSellerPrivateDetails,
} from '../../services/firestoreService';
import {
  BANGLADESH_DIVISIONS,
  getReadableErrorMessage,
  isValidBDPhone,
} from '../../shared/utils';
import type { PayoutMethod } from '../../shared/types';

export default function SellerOnboardingPage() {
  const { firebaseUser, profile, sellerProfile, isApprovedSeller } = useAuth();
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
  const [submitting, setSubmitting] = useState(false);

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

  if (!firebaseUser) return null;

  if (isApprovedSeller) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Your Seller Store Is Approved</h1>
        <p className="text-sm text-slate-600">
          Manage your products, inventory, and orders directly inside the Seller Console.
        </p>
        <Link
          to="/seller"
          className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Open Seller Console
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBDPhone(phone)) {
      showToast('Enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX).', 'error');
      return;
    }
    try {
      setSubmitting(true);
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
      showToast(
        sellerProfile
          ? 'Application updated'
          : 'Seller application submitted for Admin review',
        'success'
      );
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sell on MultiMart BD</h1>
        <p className="mt-1 text-sm text-slate-600">
          Register your store to list products in BDT (৳) and reach buyers across all 64 districts.
        </p>
      </div>

      {sellerProfile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Application Status: <strong className="uppercase">{sellerProfile.status}</strong>. An
          administrator will review and approve your store in the Admin Console.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store Name (e.g., Bengal Crafts Studio)"
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
            placeholder="Business Mobile (017XXXXXXXX)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            value={nidNumber}
            onChange={(e) => setNidNumber(e.target.value)}
            placeholder="NID / Trade License No. (optional)"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <select
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            <option value="bkash">bKash Merchant / Personal</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank Transfer</option>
          </select>
          <input
            required
            value={payoutNumber}
            onChange={(e) => setPayoutNumber(e.target.value)}
            placeholder="Payout Account / Wallet Number"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
        </div>

        <textarea
          rows={3}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Store Description (English)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />
        <textarea
          rows={2}
          value={descriptionBn}
          onChange={(e) => setDescriptionBn(e.target.value)}
          placeholder="স্টোরের বিবরণ (বাংলা - ঐচ্ছিক)"
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting
            ? 'Submitting...'
            : sellerProfile
              ? 'Update Application'
              : 'Submit Seller Application'}
        </button>
      </form>
    </div>
  );
}
