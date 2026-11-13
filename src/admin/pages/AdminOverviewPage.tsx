import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllOrdersAdmin,
  subscribeAllProductsAdmin,
  subscribeAllSellersAdmin,
  subscribeAllUsersAdmin,
  seedMarketplaceCatalog,
} from '../../services/firestoreService';
import { formatBDT, formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { Order, Product, SellerProfile, UserProfile } from '../../shared/types';

export default function AdminOverviewPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const u1 = subscribeAllOrdersAdmin(setOrders);
    const u2 = subscribeAllProductsAdmin(setProducts);
    const u3 = subscribeAllSellersAdmin(setSellers);
    const u4 = subscribeAllUsersAdmin(setUsers);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  const totalGmv = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const pendingSellers = sellers.filter((s) => s.status === 'pending').length;
  const publishedProducts = products.filter((p) => p.isActive && p.isApproved).length;

  const handleSeedCatalog = async () => {
    if (!firebaseUser) return;
    try {
      setSeeding(true);
      await seedMarketplaceCatalog(firebaseUser.uid);
      showToast('Starter categories, banner, and 4 studio products written to Firestore', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace Overview</h1>
          <p className="text-sm text-slate-500">
            Real-time metrics across orders, products, vendors, and buyers.
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={() => void handleSeedCatalog()}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          {seeding ? 'Initializing Firestore...' : 'Initialize Starter Catalog in Firestore'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        {[
          { label: 'Total Marketplace GMV', value: formatBDT(totalGmv) },
          { label: 'Platform Commission', value: formatBDT(totalCommission) },
          { label: 'Published Products', value: `${publishedProducts} / ${products.length}` },
          { label: 'Users · Pending Sellers', value: `${users.length} · ${pendingSellers}` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-extrabold font-mono text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Marketplace Orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-emerald-700">
              View All
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders placed yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-mono font-semibold text-slate-900">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      {o.customerName} → {o.sellerName} · {formatTimestamp(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-mono font-bold">{formatBDT(o.totalAmount)}</p>
                    <p className="text-xs uppercase text-emerald-700">{o.orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pending Seller Applications</h2>
            <Link to="/admin/sellers" className="text-xs font-semibold text-emerald-700">
              Manage Sellers
            </Link>
          </div>
          {pendingSellers === 0 ? (
            <p className="text-sm text-slate-500">No pending seller applications.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {sellers
                .filter((s) => s.status === 'pending')
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-semibold text-slate-900">{s.storeName}</p>
                      <p className="text-xs text-slate-500">
                        {s.district}, {s.division}
                      </p>
                    </div>
                    <Link
                      to="/admin/sellers"
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                    >
                      Review
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
