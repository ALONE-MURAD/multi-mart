import React, { useEffect, useState } from 'react';
import { useToast } from '../../shared/contexts/ToastContext';
import { subscribeAllOrdersAdmin, updateOrderStatus } from '../../services/firestoreService';
import { formatBDT, formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { Order, OrderStatus, PaymentStatus } from '../../shared/types';

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    return subscribeAllOrdersAdmin(setOrders);
  }, []);

  const handlePatch = async (
    orderId: string,
    patch: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; trackingCode?: string }
  ) => {
    try {
      await updateOrderStatus(orderId, patch);
      showToast('Order updated', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No orders recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-slate-900">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">{formatTimestamp(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-slate-800">{o.customerName}</p>
                    <p className="text-slate-500">{o.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{o.sellerName}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {formatBDT(o.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.paymentStatus}
                      onChange={(e) =>
                        void handlePatch(o.id, { paymentStatus: e.target.value as PaymentStatus })
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) =>
                        void handlePatch(o.id, { orderStatus: e.target.value as OrderStatus })
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={o.trackingCode || ''}
                      placeholder="Courier ID"
                      onBlur={(e) => {
                        if (e.target.value !== (o.trackingCode || '')) {
                          void handlePatch(o.id, { trackingCode: e.target.value });
                        }
                      }}
                      className="w-28 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
