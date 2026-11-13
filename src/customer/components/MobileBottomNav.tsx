import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useI18n } from '../../shared/contexts/I18nContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useI18n();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
      isActive ? 'text-emerald-700' : 'text-slate-500'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden">
      <NavLink to="/" end className={linkClass}>
        <Home className="h-5 w-5" />
        <span>{t.nav.home}</span>
      </NavLink>
      <NavLink to="/search" className={linkClass}>
        <Search className="h-5 w-5" />
        <span>Search</span>
      </NavLink>
      <NavLink to="/cart" className={linkClass}>
        <ShoppingCart className="h-5 w-5" />
        <span>{t.nav.cart}</span>
      </NavLink>
      <NavLink to="/wishlist" className={linkClass}>
        <Heart className="h-5 w-5" />
        <span>{t.nav.wishlist}</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User className="h-5 w-5" />
        <span>{t.nav.profile}</span>
      </NavLink>
    </nav>
  );
};
