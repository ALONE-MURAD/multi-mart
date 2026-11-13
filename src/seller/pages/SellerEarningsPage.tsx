import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { subscribeSellerOrders } from '../../services/firestoreService';
import { formatBDT, formatTimestamp } from '../../shared/utils';
import type { Order } from '../../shared/types';

export default function SellerEarningsPage() {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeSellerOrders(firebaseUser.uid, setOrders);
  }, [firebaseUser]);

  const valid = orders.filter((o) => o.orderStatus !== 'cancelled');
  const gross = valid.reduce((s, o) => s + o.subtotal, 0);
  const commission = valid.reduce((s, o) => s + (o.commissionAmount || 0), 0);
  const net = valid.reduce((s, o) => s + (o.sellerNetAmount || o.subtotal), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Earnings & Payout Ledger</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Gross Merchandise Value</p>
          <p className="mt-2 text-2xl font-extrabold font-mono text-slate-900">
            {formatBDT(gross)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Platform Commission</p>
          <p className="mt-2 text-2xl font-extrabold font-mono text-amber-700">
            {formatBDT(commission)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Net Vendor Earnings</p>
          <p className="mt-2 text-2xl font-extrabold font-mono text-emerald-700">
            {formatBDT(net)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Net Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {valid.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono font-semibold">{o.orderNumber}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatTimestamp(o.createdAt)}</td>
                <td className="px-4 py-3 text-xs uppercase font-semibold">{o.orderStatus}</td>
                <td className="px-4 py-3 text-right font-mono">{formatBDT(o.subtotal)}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-700">
                  -{formatBDT(o.commissionAmount || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                  {formatBDT(o.sellerNetAmount || o.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
