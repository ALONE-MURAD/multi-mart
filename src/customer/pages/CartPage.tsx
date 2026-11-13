import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import {
  subscribeCart,
  updateCartItemQuantity,
  removeCartItem,
} from '../../services/firestoreService';
import { formatBDT } from '../../shared/utils';
import { SafeImage } from '../../shared/components/SafeImage';
import type { CartItem } from '../../shared/types';

export default function CartPage() {
  const { firebaseUser } = useAuth();
  const { lang, t, pickText } = useI18n();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    return subscribeCart(firebaseUser.uid, (next) => {
      setItems(next);
      setLoading(false);
    });
  }, [firebaseUser]);

  if (!firebaseUser) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">{t.cart.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to view and sync your shopping bag.</p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          {t.nav.login}
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t.cart.title}</h1>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">{t.cart.empty}</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <SafeImage src={item.thumbnailUrl} alt={pickText(item.titleEn, item.titleBn)} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.productId}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 line-clamp-1"
                  >
                    {pickText(item.titleEn, item.titleBn)}
                  </Link>
                  <p className="text-xs text-slate-500">{item.sellerName}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 font-mono tabular-nums">
                    {formatBDT(item.price, lang)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        void updateCartItemQuantity(
                          firebaseUser.uid,
                          item.productId,
                          item.quantity - 1
                        )
                      }
                      className="p-2 text-slate-600 hover:bg-slate-50"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void updateCartItemQuantity(
                          firebaseUser.uid,
                          item.productId,
                          item.quantity + 1
                        )
                      }
                      className="p-2 text-slate-600 hover:bg-slate-50"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void removeCartItem(firebaseUser.uid, item.productId)}
                    className="rounded-xl p-2 text-rose-500 hover:bg-rose-50"
                    title={t.cart.remove}
                    aria-label={t.cart.remove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 h-fit space-y-4">
            <h2 className="text-lg font-bold text-slate-900">{t.checkout.orderSummary}</h2>
            <div className="flex justify-between text-sm tabular-nums">
              <span className="text-slate-600">{t.cart.subtotal}</span>
              <span className="font-bold text-slate-900 font-mono">{formatBDT(subtotal, lang)}</span>
            </div>
            <p className="text-xs text-slate-500">
              Delivery fees (Dhaka / Nationwide) are calculated at checkout.
            </p>
            <Link
              to="/checkout"
              className="block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.cart.proceedToCheckout}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
