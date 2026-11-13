import React, { useEffect, useState } from 'react';
import { useToast } from '../../shared/contexts/ToastContext';
import { subscribeAllUsersAdmin, updateUserAdmin } from '../../services/firestoreService';
import { formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { UserProfile, UserRole, UserStatus } from '../../shared/types';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    return subscribeAllUsersAdmin(setUsers);
  }, []);

  const handleUpdate = async (uid: string, patch: { role?: UserRole; status?: UserStatus }) => {
    try {
      await updateUserAdmin(uid, patch);
      showToast('User updated', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.uid}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{u.displayName}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatTimestamp(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => void handleUpdate(u.uid, { role: e.target.value as UserRole })}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.status}
                    onChange={(e) =>
                      void handleUpdate(u.uid, { status: e.target.value as UserStatus })
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
