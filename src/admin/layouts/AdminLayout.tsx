import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Store,
  ShoppingBag,
  Image,
  Megaphone,
  Settings,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../shared/contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { profile, logout } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-emerald-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 text-slate-100 p-4">
        <div className="px-2 py-2 border-b border-slate-800">
          <p className="text-base font-extrabold tracking-tight text-white">MultiMart BD Admin</p>
          <p className="mt-0.5 text-xs text-slate-400 truncate">{profile?.email}</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            <Package className="h-4 w-4 shrink-0" />
            <span>Products</span>
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>
            <FolderTree className="h-4 w-4 shrink-0" />
            <span>Categories</span>
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/admin/sellers" className={navClass}>
            <Store className="h-4 w-4 shrink-0" />
            <span>Sellers</span>
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            <Users className="h-4 w-4 shrink-0" />
            <span>Users</span>
          </NavLink>
          <NavLink to="/admin/banners" className={navClass}>
            <Image className="h-4 w-4 shrink-0" />
            <span>Banners</span>
          </NavLink>
          <NavLink to="/admin/ads" className={navClass}>
            <Megaphone className="h-4 w-4 shrink-0" />
            <span>Advertisements</span>
          </NavLink>
          <NavLink to="/admin/settings" className={navClass}>
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings & Support</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Storefront
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Link to="/" className="lg:hidden text-emerald-700">
              Storefront
            </Link>
            <span>MultiMart BD / Admin Console</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/products/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
            >
              Add Product
            </Link>
          </div>
        </header>

        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-900 px-4 py-2 lg:hidden">
          <NavLink to="/admin" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>
            Categories
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            Orders
          </NavLink>
          <NavLink to="/admin/sellers" className={navClass}>
            Sellers
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            Users
          </NavLink>
          <NavLink to="/admin/banners" className={navClass}>
            Banners
          </NavLink>
          <NavLink to="/admin/ads" className={navClass}>
            Ads
          </NavLink>
          <NavLink to="/admin/settings" className={navClass}>
            Settings
          </NavLink>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
