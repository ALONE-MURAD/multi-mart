import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Store,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';

export const SellerLayout: React.FC = () => {
  const { sellerProfile, profile } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-emerald-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4">
        <div className="px-2 py-2">
          <p className="text-base font-extrabold text-slate-900 truncate">
            {sellerProfile?.storeName || 'Seller Console'}
          </p>
          <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          <NavLink to="/seller" end className={navClass}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/seller/products" className={navClass}>
            <Package className="h-4 w-4 shrink-0" />
            <span>Products & Inventory</span>
          </NavLink>
          <NavLink to="/seller/orders" className={navClass}>
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/seller/earnings" className={navClass}>
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Earnings</span>
          </NavLink>
          <NavLink to="/seller/profile" className={navClass}>
            <Store className="h-4 w-4 shrink-0" />
            <span>Store Profile</span>
          </NavLink>
        </nav>

        <Link
          to="/"
          className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Storefront
        </Link>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Link to="/" className="md:hidden text-emerald-700">
              Storefront
            </Link>
            <span>MultiMart BD / Seller Console</span>
          </div>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          <NavLink to="/seller" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/seller/products" className={navClass}>
            Products
          </NavLink>
          <NavLink to="/seller/orders" className={navClass}>
            Orders
          </NavLink>
          <NavLink to="/seller/earnings" className={navClass}>
            Earnings
          </NavLink>
          <NavLink to="/seller/profile" className={navClass}>
            Profile
          </NavLink>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
