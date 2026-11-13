import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeCart,
  subscribePlatformSettings,
  placeOrderTransactional,
} from '../../services/firestoreService';
import {
  BANGLADESH_DIVISIONS,
  DEFAULT_PLATFORM_SETTINGS,
  formatBDT,
  getReadableErrorMessage,
  isValidBDPhone,
} from '../../shared/utils';
import type { CartItem, PaymentMethod, PlatformSettings } from '../../shared/types';

export default function CheckoutPage() {
  const { firebaseUser, profile } = useAuth();
  const { lang, t, pickText } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState<string>('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  useEffect(() => {
    if (!firebaseUser) return;
    const uCart = subscribeCart(firebaseUser.uid, setItems);
    const uSettings = subscribePlatformSettings(setSettings);
    return () => {
      uCart();
      uSettings();
    };
  }, [firebaseUser]);

  useEffect(() => {
    if (profile) {
      setFullName((prev) => prev || profile.displayName || '');
      setPhone((prev) => prev || profile.phone || '');
      const defAddr = profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0];
      if (defAddr) {
        setFullName(defAddr.fullName);
        setPhone(defAddr.phone);
        setDivision(defAddr.division);
        setDistrict(defAddr.district);
        setArea(defAddr.area);
        setStreetAddress(defAddr.streetAddress);
      }
    }
  }, [profile]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const sellerCount = new Set(items.map((i) => i.sellerId)).size;
  const perSellerFee =
    division === 'Dhaka' ? settings.deliveryFeeInsideDhaka : settings.deliveryFeeOutsideDhaka;
  const deliveryFee =
    subtotal >= settings.freeShippingThreshold ? 0 : perSellerFee * Math.max(1, sellerCount);
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (items.length === 0) {
      showToast('Your shopping bag is empty.', 'error');
      return;
    }
    if (!isValidBDPhone(phone)) {
      showToast('Please enter a valid Bangladeshi mobile number (e.g., 017XXXXXXXX).', 'error');
      return;
    }
    if (!fullName.trim() || !district.trim() || !area.trim() || !streetAddress.trim()) {
      showToast('Please complete all shipping address fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await placeOrderTransactional({
        customerId: firebaseUser.uid,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        paymentMethod,
        settings,
        shippingAddress: {
          id: `addr-${Date.now()}`,
          label: 'Shipping',
          fullName: fullName.trim(),
          phone: phone.trim(),
          division,
          district: district.trim(),
          area: area.trim(),
          streetAddress: streetAddress.trim(),
          isDefault: false,
        },
      });
      showToast('Order placed successfully', 'success');
      navigate('/orders');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h1 className="text-xl font-bold text-slate-900">{t.checkout.shippingAddress}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Recipient Full Name"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile (e.g. 01712345678)"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              {BANGLADESH_DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
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
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Thana / Area"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <input
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="House, Road, Holding No."
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t.checkout.paymentMethod}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'cod' as const, label: 'Cash on Delivery (COD)', note: 'Pay cash when parcel arrives' },
              { id: 'bkash' as const, label: 'bKash', note: 'Mobile wallet payment' },
              { id: 'nagad' as const, label: 'Nagad', note: 'Digital mobile wallet' },
              { id: 'sslcommerz' as const, label: 'SSLCommerz', note: 'Cards & Net Banking' },
            ].map((pm) => (
              <label
                key={pm.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  paymentMethod === pm.id
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === pm.id}
                  onChange={() => setPaymentMethod(pm.id)}
                  className="mt-1 accent-emerald-600"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">{pm.label}</span>
                  <span className="block text-xs text-slate-500">{pm.note}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900">{t.checkout.orderSummary}</h2>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-slate-900 truncate">
                    {pickText(item.titleEn, item.titleBn)}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Qty {item.quantity} · {item.sellerName}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 font-mono tabular-nums shrink-0">
                  {formatBDT(item.price * item.quantity, lang)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-600">{t.cart.subtotal}</span>
              <span className="font-semibold font-mono">{formatBDT(subtotal, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.checkout.deliveryFee}</span>
              <span className="font-semibold font-mono">
                {deliveryFee === 0 ? t.checkout.free : formatBDT(deliveryFee, lang)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
              <span>{t.checkout.total}</span>
              <span className="font-mono">{formatBDT(total, lang)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Confirming Order...' : t.checkout.placeOrder}
          </button>
        </div>
      </div>
    </form>
  );
}
