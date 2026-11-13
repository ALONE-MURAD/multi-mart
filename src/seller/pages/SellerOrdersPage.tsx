import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { subscribeSellerOrders, updateOrderStatus } from '../../services/firestoreService';
import { formatBDT, formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { Order, OrderStatus } from '../../shared/types';

export default function SellerOrdersPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeSellerOrders(firebaseUser.uid, setOrders);
  }, [firebaseUser]);

  const handleUpdate = async (orderId: string, orderStatus: OrderStatus, trackingCode?: string) => {
    try {
      await updateOrderStatus(orderId, {
        orderStatus,
        ...(trackingCode !== undefined ? { trackingCode } : {}),
      });
      showToast('Order updated', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Vendor Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No customer orders for your store yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {order.customerName} · {order.customerPhone} · {formatTimestamp(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBDT(order.totalAmount)}
                  </span>
                  <select
                    disabled={order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'}
                    value={order.orderStatus}
                    onChange={(e) => void handleUpdate(order.id, e.target.value as OrderStatus)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Items: {order.items.map((i) => `${i.titleEn} × ${i.quantity}`).join(', ')}
                </p>
                <p>
                  Ship to: {order.shippingAddress.streetAddress}, {order.shippingAddress.area},{' '}
                  {order.shippingAddress.district}, {order.shippingAddress.division}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
