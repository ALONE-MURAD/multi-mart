import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { subscribeSellerOrders, subscribeSellerProducts } from '../../services/firestoreService';
import { formatBDT } from '../../shared/utils';
import type { Order, Product } from '../../shared/types';

export default function SellerOverviewPage() {
  const { firebaseUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    const u1 = subscribeSellerProducts(firebaseUser.uid, setProducts);
    const u2 = subscribeSellerOrders(firebaseUser.uid, setOrders);
    return () => {
      u1();
      u2();
    };
  }, [firebaseUser]);

  const grossSales = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.subtotal, 0);
  const netEarnings = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.sellerNetAmount || o.subtotal), 0);
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller Overview</h1>
        <p className="text-sm text-slate-500">Live sales, inventory, and fulfillment metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        {[
          { label: 'Gross Sales', value: formatBDT(grossSales), mono: true },
          { label: 'Net Earnings', value: formatBDT(netEarnings), mono: true },
          { label: 'Total Orders', value: String(orders.length), mono: true },
          { label: 'Listed Products', value: String(products.length), mono: true },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <Link to="/seller/orders" className="text-xs font-semibold text-emerald-700">
              Manage All
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders received yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-slate-900 font-mono">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">{o.customerName}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-bold font-mono">{formatBDT(o.totalAmount)}</p>
                    <p className="text-xs uppercase text-emerald-700">{o.orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Low Stock Alerts (≤ 5)</h2>
            <Link to="/seller/products" className="text-xs font-semibold text-emerald-700">
              Inventory
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">All products have healthy stock levels.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="truncate pr-4 font-medium text-slate-800">{p.titleEn}</span>
                  <span className="font-mono font-bold text-rose-600 tabular-nums shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
