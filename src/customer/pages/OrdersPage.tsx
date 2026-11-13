import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useI18n } from '../../shared/contexts/I18nContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { subscribeCustomerOrders, updateOrderStatus } from '../../services/firestoreService';
import { formatBDT, formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { Order } from '../../shared/types';

export default function OrdersPage() {
  const { firebaseUser } = useAuth();
  const { lang, t } = useI18n();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeCustomerOrders(firebaseUser.uid, (items) => {
      setOrders(items);
      setLoading(false);
    });
  }, [firebaseUser]);

  const handleCancel = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { orderStatus: 'cancelled' });
      showToast('Order cancelled', 'info');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t.nav.orders}</h1>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">You have not placed any orders yet.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="text-sm">
                  <span className="font-bold text-slate-900 font-mono">{order.orderNumber}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">{order.sellerName}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{formatTimestamp(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="uppercase text-emerald-700">{order.orderStatus}</span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Track Order
                  </Link>
                  {order.orderStatus === 'pending' && (
                    <button
                      type="button"
                      onClick={() => void handleCancel(order.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="text-slate-600">
                  {order.items.map((item) => `${item.titleEn} × ${item.quantity}`).join(', ')}
                </div>
                <div className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatBDT(order.totalAmount, lang)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
