import React, { useEffect, useState } from 'react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribeAllSellersAdmin,
  updateSellerStatusAdmin,
} from '../../services/firestoreService';
import { getReadableErrorMessage } from '../../shared/utils';
import type { SellerProfile, SellerStatus } from '../../shared/types';

export default function AdminSellersPage() {
  const { showToast } = useToast();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  useEffect(() => {
    return subscribeAllSellersAdmin(setSellers);
  }, []);

  const handleStatusChange = async (sellerId: string, status: SellerStatus) => {
    try {
      await updateSellerStatusAdmin(sellerId, { status });
      showToast(`Seller status updated to ${status}`, 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  const handleToggleVerify = async (seller: SellerProfile) => {
    try {
      await updateSellerStatusAdmin(seller.id, { verified: !seller.verified });
      showToast(seller.verified ? 'Verification removed' : 'Seller verified', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Seller Management</h1>

      {sellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No seller stores registered yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Store Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{s.storeName}</p>
                    <p className="text-xs font-mono text-slate-500">{s.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {s.district}, {s.division}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleVerify(s)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        s.verified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.verified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={(e) => void handleStatusChange(s.id, e.target.value as SellerStatus)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                    </select>
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
